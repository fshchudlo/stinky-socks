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
        return repositories.filter((repo: any) => !repo.archived && !repo.disabled);
    }

    async getClosedPullRequests(owner: string, repo: string, page: number, per_page: number): Promise<any[]> {
        const url = `${this.baseUrl}/repos/${owner}/${repo}/pulls`;
        return await this.get(url, {
            state: "closed",
            sort: "created",
            direction: "asc",
            page,
            per_page
        });
    }
}
