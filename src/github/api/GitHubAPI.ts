import axios, { AxiosRequestConfig } from "axios";

export class GitHubAPI {
    private readonly token: string;

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
        const requestParams = {
            page: params?.page ?? 1,
            per_page: params?.per_page ?? 100,
            ...params
        };

        const result: any[] = [];
        let response = await this.get(url, requestParams);
        result.push(...response);

        while (true) {
            response = await this.get(url, requestParams);

            result.push(...response);

            if (response.length < 100)
                break;
            params.page++;
        }
        return result;
    }

    async fetchAllRepositories(orgName: string): Promise<any[]> {
        const repositories = await this.getFullList(`https://api.github.com/orgs/${orgName}/repos`);
        return repositories.filter((repo: any) => !repo.archived && !repo.archived);
    }

    async getMergedPullRequests(projectKey: string, repositoryName: string, start: number, limit: number): Promise<any[]> {
        throw new Error(`Method not implemented. ${projectKey}, ${repositoryName}, ${start}, ${limit}`);
    }
}
