import axios from "axios";

export class GitHubAPI {
    static async getUserRepositories(accessToken: string): Promise<Array<{ full_name: string; }>>{
        const repositories = await axios.get('https://api.github.com/user/repos', {
            headers: {Authorization: `token ${accessToken}`}
        });
        return repositories.data;
    }
}