import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { GitHubFileDiffModel, GitHubPullRequestActivityModel, GitHubPullRequestModel } from "../GitHubAPI.contracts";
import { fetchAccessToken } from "./GitHubCredentialsHelper";

const rateLimitLocks: { [key: string]: boolean; } = {};
export type GitHubAppAuthParams = { appId: number, privateKey: string, organizationId: number };

export class GitHubAPI {
    private readonly getAuthHeader: () => Promise<string>;
    private readonly baseUrl = "https://api.github.com";

    constructor(auth: string | GitHubAppAuthParams) {
        if (typeof auth === "string") {
            this.getAuthHeader = () => Promise.resolve(`token ${auth}`);
        } else {
            this.getAuthHeader = async () => {
                const jwtToken = await fetchAccessToken(auth.appId, auth.privateKey, auth.organizationId);
                return `Bearer ${jwtToken}`;
            };
        }
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
        const config: AxiosRequestConfig = {
            headers: {
                "Authorization": await this.getAuthHeader(),
                "Accept": "application/vnd.github.v3+json"
            },
            params: params
        };
        const response = await axios.get(url, config);

        await this.checkRateLimits(response);

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

    private async checkRateLimits(response: AxiosResponse<any>) {
        if (parseInt(response.headers["x-ratelimit-remaining"], 10) <= 10) {
            const resetTime = parseInt(response.headers["x-ratelimit-reset"], 10) * 1000;
            // Add ten more seconds to ensure we didn't violate the rate limit
            const waitTime = 10000 + resetTime - Date.now();
            const lockKey = await this.getAuthHeader();

            // We run requests in parallel, and it's possible that a request was blocked because this check was triggered by another request.
            // By the time it resumes execution, the rate limit may have already reset.
            // To avoid redundant waiting, we recheck the actual wait time, as it represents an absolute value.
            if (waitTime <= 0 || rateLimitLocks[lockKey]) {
                return;
            }

            console.log(`🫸 The GitHub API rate limit exceeded. Waiting for ${convertMillisecondsToHumanReadableTime(waitTime)}...`);
            rateLimitLocks[lockKey] = true;
            await new Promise(resolve => setTimeout(resolve, waitTime)).finally(() => rateLimitLocks[lockKey] = false);
            console.log(`💃 The GitHub API rate limit is updated. Let's move on...`);
        }

        function convertMillisecondsToHumanReadableTime(milliseconds: number): string {
            let seconds = milliseconds / 1000;
            const units: [string, number][] = [
                ["hour", 3600],
                ["minute", 60],
                ["second", 1]
            ];

            const parts: string[] = [];

            for (const [unitName, unitSeconds] of units) {
                const unitValue = Math.floor(seconds / unitSeconds);
                if (unitValue > 0) {
                    parts.push(`${unitValue} ${unitName}${unitValue > 1 ? "s" : ""}`);
                }
                seconds %= unitSeconds;
            }

            return parts.join(", ");
        }
    }
}
