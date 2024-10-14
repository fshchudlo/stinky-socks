import axios, { AxiosRequestConfig } from "axios";

export class BitbucketAPI {
    private readonly baseUrl: string;
    private readonly token: string;

    constructor(baseUrl: string, token: string) {
        this.baseUrl = baseUrl;
        this.token = token;
    }

    private async get(url: string, params: any = undefined): Promise<any> {
        const config: AxiosRequestConfig = {
            headers: {
                "Authorization": `Bearer ${this.token}`
            },
            params: params
        };
        const response = await axios.get(url, config);
        if (response.status === 200) {
            return response.data;
        }
        throw new Error(`Error executing request for ${url} message: ${response.statusText}`);
    }

    private async getList(url: string, params: any = undefined): Promise<any[]> {
        const requestParams = {
            start: params?.start ?? 0,
            limit: params?.limit ?? 100,
            ...params
        };

        const result: any[] = [];
        let response = await this.get(url, requestParams);
        result.push(...response.values);

        while (!response.isLastPage) {
            requestParams.start += requestParams.limit;
            response = await this.get(url, requestParams);
            result.push(...response.values);
        }
        return result;
    }

    async getPullRequestsHistory(projectKey: string, repositorySlug: string, start = 0, state = "MERGED", order = "OLDEST"): Promise<any[]> {
        const url = `${this.baseUrl}/projects/${projectKey}/repos/${repositorySlug}/pull-requests`;

        return await this.getList(url, {
            withAttributes: true,
            withProperties: true,
            state,
            order,
            start
        });
    }

    async getPullRequestActivities(projectKey: string, repositorySlug: string, pullRequestId: number): Promise<any[]> {
        const url = `${this.baseUrl}/projects/${projectKey}/repos/${repositorySlug}/pull-requests/${pullRequestId}/activities?limit=1000`;
        return await this.getList(url);
    }

    async getPullRequestCommits(projectKey: string, repositorySlug: string, pullRequestId: number): Promise<any[]> {
        const url = `${this.baseUrl}/projects/${projectKey}/repos/${repositorySlug}/pull-requests/${pullRequestId}/commits?limit=1000`;
        return await this.getList(url);
    }

    async getPullRequestDiff(projectKey: string, repositorySlug: string, pullRequestId: number): Promise<any> {
        const url = `${this.baseUrl}/projects/${projectKey}/repos/${repositorySlug}/pull-requests/${pullRequestId}/diff?limit=1000`;
        return await this.get(url);
    }
}
