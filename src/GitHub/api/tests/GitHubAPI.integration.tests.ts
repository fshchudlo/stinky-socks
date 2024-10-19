import "dotenv/config";
import { GitHubAPI } from "../GitHubAPI";

describe("GitHubAPI 𝑰𝒏𝒕𝒆𝒈𝒓𝒂𝒕𝒊𝒐𝒏 Test", () => {
    it.skip("should fetch pull requests history", async () => {
        const owner = "grafana";
        const repoName = "grafana";
        const sut = new GitHubAPI(process.env.GITHUB_API_TOKEN as string);

        const repositories = await sut.fetchAllRepositories(owner);
        expect(repositories).not.toHaveLength(0);

        const pullRequestsHistory = await sut.getClosedPullRequests(owner, repoName, 1, 10);
        expect(pullRequestsHistory.values).not.toHaveLength(0);

    });
});