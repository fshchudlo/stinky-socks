import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { GitHubFileDiffModel, GitHubPullRequestActivityModel, GitHubPullRequestModel } from "../GitHubAPI.contracts";

let rateLimitLockAcquired = false;

export class GitHubAPI {
    private readonly token: string;
    private readonly baseUrl = "https://api.github.com";
    private readonly pauseOnRateLimitThreshold: boolean;

    constructor(token: string, addressRateLimits: boolean = true) {
        this.token = token;
        this.pauseOnRateLimitThreshold = addressRateLimits;
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
                "Authorization": `token ${this.token}`,
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
        if (this.pauseOnRateLimitThreshold && parseInt(response.headers["x-ratelimit-remaining"], 10) <= 10) {
            const resetTime = parseInt(response.headers["x-ratelimit-reset"], 10) * 1000;
            // Add ten more seconds to ensure we didn't violate the rate limit
            const waitTime = 10000 + resetTime - Date.now();

            // We run requests in parallel, and it's possible that a request was blocked because this check was triggered by another request.
            // By the time it resumes execution, the rate limit may have already reset.
            // To avoid redundant waiting, we recheck the actual wait time, as it represents an absolute value.
            if (waitTime <= 0 || rateLimitLockAcquired) {
                return;
            }

            console.log(`🫸 The GitHub API rate limit exceeded. Waiting for ${convertMillisecondsToHumanReadableTime(waitTime)}...`);
            rateLimitLockAcquired = true;
            await new Promise(resolve => setTimeout(resolve, waitTime)).finally(() => rateLimitLockAcquired = false);
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
