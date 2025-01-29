import "dotenv/config";
import { GitHubAPI } from "../GitHubAPI";
import {fetchNextTokenHeader} from "../GitHubTokenCredentialsHelper";

describe("GitHubAPI 𝑰𝒏𝒕𝒆𝒈𝒓𝒂𝒕𝒊𝒐𝒏 Test", () => {
    it.skip("should fetch pull requests history", async () => {
        const owner = "grafana";
        const repoName = "grafana";
        const sut = new GitHubAPI(async () => await fetchNextTokenHeader((process.env.GITHUB_PUBLIC_API_TOKENS as string).split(' ')));

        const repositories = await sut.fetchAllRepositories(owner);
        expect(repositories).not.toHaveLength(0);

        const pullRequestsHistory = await sut.getClosedPullRequests(owner, repoName, 1, 10);
        expect(pullRequestsHistory.values).not.toHaveLength(0);


        const pullRequestsFiles = await sut.getPullRequestFiles(owner, repoName, pullRequestsHistory[0].number);
        expect(pullRequestsFiles.values).not.toHaveLength(0);

        const pullRequestsActivities = await sut.getPullRequestActivities(owner, repoName, pullRequestsHistory[0].number);
        expect(pullRequestsActivities.values).not.toHaveLength(0);

    });
});