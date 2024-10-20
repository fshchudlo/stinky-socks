import axios, { AxiosRequestConfig } from "axios";

export class GitHubAPI {
    private readonly token: string;
    private readonly baseUrl = "https://api.github.com";

    constructor(token: string) {
        this.token = token;
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
        if (response.headers['x-ratelimit-remaining'] === '1') {
            const resetTime = parseInt(response.headers['x-ratelimit-reset'], 10) * 1000;
            const currentTime = Date.now();
            const waitTime = resetTime - currentTime;

            console.warn(`GitHub API rate limit exceeded. Waiting for ${waitTime / 1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }

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

    async fetchAllRepositories(owner: string): Promise<any[]> {
        const repositories = await this.getFullList(`${this.baseUrl}/orgs/${owner}/repos`);
        return repositories.filter(repo => !repo.archived && !repo.disabled);
    }

    async getClosedPullRequests(owner: string, repo: string, page: number, per_page: number): Promise<GitHubPullRequestModel[]> {
        const url = `${this.baseUrl}/repos/${owner}/${repo}/pulls`;
        return await this.get(url, {
            state: "closed",
            sort: "created",
            direction: "asc",
            page,
            per_page
        });
    }

    async getPullRequestActivities(owner: string, repo: string, pullRequestId: number): Promise<GitHubPullRequestActivityModel[]> {
        const url = `${this.baseUrl}/repos/${owner}/${repo}/issues/${pullRequestId}/timeline`;
        return await this.getFullList(url);
    }

    async getPullRequestFiles(owner: string, repo: string, pullRequestId: number): Promise<GitHubFileModel[]> {
        const url = `${this.baseUrl}/repos/${owner}/${repo}/pulls/${pullRequestId}/files`;
        return await this.getFullList(url);
    }
}

export type GitHubPullRequestModel = {
    author_association: "COLLABORATOR" | "CONTRIBUTOR" | "FIRST_TIMER" | "FIRST_TIME_CONTRIBUTOR" | "MEMBER" | "OWNER" | "MANNEQUIN" | "NONE";
    base: {
        repo: {
            owner: GitHubUserModel;
            name: string;
        };
        ref: string;
    };
    number: number;
    user: GitHubUserModel;
    html_url: string;
    requested_reviewers: GitHubUserModel[];
    assignees: GitHubUserModel[];
    created_at: string;
    merged_at: string;
};

export type GitHubPullRequestActivityModel = {
    comments: {
        created_at: string;
        user: GitHubUserModel
    }[];
    event: string;
    created_at: string;
    committer?: GitHubUserModel & {
        date: string;
    };
    user: GitHubUserModel;
    actor?: GitHubUserModel;
    author?: GitHubUserModel & {
        date: string;
    };
    requested_reviewer?: GitHubUserModel;
    state?: string;
    submitted_at?: string;
};

export type GitHubFileModel = {
    filename: string;
    changes: number;
};
export type GitHubUserModel = {
    login: string;
};