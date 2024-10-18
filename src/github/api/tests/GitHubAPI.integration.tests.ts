import { GitHubAPI } from "../GitHubAPI";
import { appImportConfig } from "../../../app.importConfig";

describe("GithubAPI 𝑰𝒏𝒕𝒆𝒈𝒓𝒂𝒕𝒊𝒐𝒏 Test", () => {
    it.skip("should fetch pull requests history", async () => {
        const projectKey = "grafana";
        const apiCreds = appImportConfig.teams.flatMap(t => t.gitHubProjects)[0].auth;

        const sut = new GitHubAPI(apiCreds.apiToken);

        const repositories = await sut.fetchAllRepositories(projectKey);
        expect(repositories).not.toHaveLength(0);

    });
});