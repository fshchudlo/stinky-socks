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

    async fetchAllRepositories(orgName: string): Promise<string[]> {
        const repositories: any[] = [];
        let page = 1;

        while (true) {
            const response = await this.get(`https://api.github.com/orgs/${orgName}/repos`, {
                per_page: 100,
                page: page
            });

            repositories.push(...response.filter((repo: any) => !repo.archived && !repo.archived));

            if (response.length < 100)
                break;
            page++;
        }
        return repositories;
    }
}
