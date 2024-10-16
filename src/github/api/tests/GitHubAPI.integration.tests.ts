import { AppConfig } from "../../../app.config";
import { GitHubAPI } from "../GitHubAPI";

describe("GithubAPI 𝑰𝒏𝒕𝒆𝒈𝒓𝒂𝒕𝒊𝒐𝒏 Test", () => {
    it.skip("should fetch pull requests history", async () => {
        const projectKey = "grafana";

        const sut = new GitHubAPI(AppConfig.Github.API_TOKEN);

        const repositories = await sut.fetchAllRepositories(projectKey);
        expect(repositories).not.toHaveLength(0);

    });
});