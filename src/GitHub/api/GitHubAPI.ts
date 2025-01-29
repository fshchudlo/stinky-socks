import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { GitHubFileDiffModel, GitHubPullRequestActivityModel, GitHubPullRequestModel } from "../GitHubAPI.contracts";
import * as https from "node:https";
import {checkAPIRateLimits} from "./checkAPIRateLimits";

const agent = new https.Agent({ keepAlive: true });

export class GitHubAPI {
    private readonly getAuthHeader: () => Promise<string>;
    private readonly baseUrl = "https://api.github.com";

    constructor(authHeaderBuilder: () => Promise<string>) {
        this.getAuthHeader = authHeaderBuilder;
    }

    async fetchAllRepositories(owner: string): Promise<any[]> {
        const repositories = await this.getFullList(`${this.baseUrl}/orgs/${owner}/repos`);
        return repositories.filter(repo => !repo.archived && !repo.disabled);
    }

    async getClosedPullRequests(owner: string, repo: string, pageNumber: number, pageSize: number): Promise<GitHubPullRequestModel[]> {
        const url = `${this.baseUrl}/repos/${owner}/${repo}/pulls`;
        return await this.get(url, {
            state: "closed",
            sort: "updated",
            direction: "asc",
            page: pageNumber,
            per_page: pageSize
        });
    }

    async getPullRequest(owner: string, repo: string, pullRequestNumber: number): Promise<GitHubPullRequestModel> {
        const url = `${this.baseUrl}/repos/${owner}/${repo}/pulls/${pullRequestNumber}`;
        return await this.get(url);
    }

    async getPullRequestActivities(owner: string, repo: string, pullRequestId: number): Promise<GitHubPullRequestActivityModel[]> {
        const url = `${this.baseUrl}/repos/${owner}/${repo}/issues/${pullRequestId}/timeline`;
        return await this.getFullList(url);
    }

    async getPullRequestFiles(owner: string, repo: string, pullRequestId: number): Promise<GitHubFileDiffModel[]> {
        const url = `${this.baseUrl}/repos/${owner}/${repo}/pulls/${pullRequestId}/files`;
        return await this.getFullList(url);
    }

    private async get(url: string, params: any = undefined): Promise<any> {
        const authHeader = await this.getAuthHeader();
        
        const config: AxiosRequestConfig = {
            headers: {
                "Authorization": authHeader,
                "Accept": "application/vnd.github.v3+json"
            },
            httpsAgent: agent,
            params: params
        };
        const response = await axios.get(url, config);

        await checkAPIRateLimits(response, authHeader);

        if (response.status === 200) {
            return response.data;
        }
        throw new Error(`Error executing request for ${url} message: ${response.statusText}`);
    }

    private async getFullList(url: string, params: any = undefined): Promise<any[]> {
        const pageSize = params?.per_page ?? 100;
        const requestParams = {
            page: params?.page ?? 1,
            per_page: pageSize,
            ...params
        };

        const result: any[] = [];
        while (true) {
            const response = await this.get(url, requestParams);

            result.push(...response);

            if (response.length < pageSize)
                break;
            requestParams.page++;
        }
        return result;
    }
}
