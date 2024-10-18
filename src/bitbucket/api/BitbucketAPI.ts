import axios, { AxiosRequestConfig } from "axios";

export type BitbucketPagedResponse<T> = {
    "size": number;
    "limit": number;
    "isLastPage": boolean;
    "start": number;
    "values": T[];
}
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

    private async getFullList(url: string, params: any = undefined): Promise<any[]> {
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

    async fetchAllRepositories(projectKey: string): Promise<any[]> {
        const url = `${this.baseUrl}/projects/${projectKey}/repos/`;
        return await this.getFullList(url);
    }

    async getMergedPullRequests(projectKey: string, repositorySlug: string, start: number, limit: number): Promise<BitbucketPagedResponse<BitbucketPullRequestModel>> {
        const url = `${this.baseUrl}/projects/${projectKey}/repos/${repositorySlug}/pull-requests`;

        return (await this.get(url, {
            state: "MERGED",
            order: "OLDEST",
            start,
            limit
        }));
    }

    async getPullRequestActivities(projectKey: string, repositorySlug: string, pullRequestId: number): Promise<BitbucketPullRequestActivityModel[]> {
        const url = `${this.baseUrl}/projects/${projectKey}/repos/${repositorySlug}/pull-requests/${pullRequestId}/activities`;
        return await this.getFullList(url);
    }

    async getPullRequestCommits(projectKey: string, repositorySlug: string, pullRequestId: number): Promise<BitbucketCommitModel[]> {
        const url = `${this.baseUrl}/projects/${projectKey}/repos/${repositorySlug}/pull-requests/${pullRequestId}/commits`;
        return await this.getFullList(url);
    }

    async getPullRequestDiff(projectKey: string, repositorySlug: string, pullRequestId: number): Promise<BitbucketDiffModel> {
        const url = `${this.baseUrl}/projects/${projectKey}/repos/${repositorySlug}/pull-requests/${pullRequestId}/diff`;
        return await this.get(url);
    }
}
export type BitbucketPullRequestModel = {
    id: number;
    author: {
        user: {
            name: string;
        };
    };
    toRef: {
        repository: {
            project: {
                key: string;
            };
            slug: string;
        };
        displayId: string;
    };
    links: {
        self: {
            href: string;
        }[];
    };
    reviewers: {
        user: {
            name: string;
        };
    }[];
    participants: {
        user: {
            name: string;
        };
    }[];
    properties?: {
        resolvedTaskCount?: number;
        openTaskCount?: number;
    };
    createdDate: number;
    closedDate: number;
}
export type BitbucketPullRequestActivityModel = {
    createdDate: number;
    addedReviewers?: {
        name: string;
    }[];
    user: {
        name: string;
    };
    action?: string;
    fromHash?: string;
    previousFromHash?: string;
};

export type BitbucketCommitModel = {
    authorTimestamp: number;
    committerTimestamp: number;
};

export type BitbucketDiffModel = {
    diffs: {
        hunks: {
            segments: {
                type: string;
                lines: string[];
            }[];
        }[];
    }[];
};