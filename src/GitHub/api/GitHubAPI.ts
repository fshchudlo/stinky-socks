import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { GitHubFileDiffModel, GitHubPullRequestActivityModel, GitHubPullRequestModel } from "./GitHubAPI.contracts";

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
        const result = await this.getFullList(url);
        return result.map(a => {
            if (!["disconnected", "auto_rebase_enabled", "base_ref_force_pushed", "connected", "auto_merge_disabled", "auto_squash_enabled", "convert_to_draft", "unsubscribed", "locked", "removed_from_project", "moved_columns_in_project", "added_to_project", "review_dismissed", "comment_deleted", "base_ref_changed", "review_request_removed", "unassigned", "reopened", "demilestoned", "line-commented", "head_ref_restored", "automatic_base_change_succeeded", "ready_for_review", "reviewed", "review_requested", "cross-referenced", "referenced", "commented", "committed", "merged", "closed", "unlabeled", "milestoned", "renamed", "labeled", "head_ref_deleted", "head_ref_force_pushed", "mentioned", "subscribed", "assigned"].includes(a.event)) {
                throw new Error(`Unknown event type: ${a.event}`);
            }
            return a;
        });
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
        if (+this.pauseOnRateLimitThreshold && response.headers["x-ratelimit-remaining"] <= 100) {
            const resetTime = +response.headers["x-ratelimit-reset"] * 1000;
            const currentTime = Date.now();
            const waitTime = resetTime - currentTime;
            const waitTimeString = convertMillisecondsToHumanReadableTime(waitTime);

            console.warn(`🫸 GitHub API rate limit exceeded. Waiting for ${waitTimeString}...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
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
