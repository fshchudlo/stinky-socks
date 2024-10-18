import { GitHubAPI } from "../GitHubAPI";
import { appImportConfig } from "../../../app.importConfig";

describe("GithubAPI 𝑰𝒏𝒕𝒆𝒈𝒓𝒂𝒕𝒊𝒐𝒏 Test", () => {
    it.skip("should fetch pull requests history", async () => {
        const owner = "grafana";
        const repoName = "grafana";
        const apiCreds = appImportConfig.teams.flatMap(t => t.gitHubProjects)[0].auth;

        const sut = new GitHubAPI(apiCreds.apiToken);

        const repositories = await sut.fetchAllRepositories(owner);
        expect(repositories).not.toHaveLength(0);

        const pullRequestsHistory = await sut.getClosedPullRequests(owner, repoName, 1, 10);
        expect(pullRequestsHistory.values).not.toHaveLength(0);

    });
});