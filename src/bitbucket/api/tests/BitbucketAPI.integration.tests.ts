import "dotenv/config";
import { BitbucketAPI } from "../BitbucketAPI";

describe("BitbucketAPI 𝑰𝒏𝒕𝒆𝒈𝒓𝒂𝒕𝒊𝒐𝒏 Test", () => {
    it.skip("should fetch pull requests history", async () => {
        const projectKey = "TEST";
        const repositorySlug = "test";

        const sut = new BitbucketAPI(process.env.BITBUCKET_API_URL as string, process.env.BITBUCKET_API_TOKEN as string);

        const repositories = await sut.fetchAllRepositories(projectKey);
        expect(repositories).not.toHaveLength(0);

        const pullRequestsHistory = await sut.getMergedPullRequests(projectKey, repositorySlug, 0, 10);
        expect(pullRequestsHistory.values).not.toHaveLength(0);

        const activities = await sut.getPullRequestActivities(projectKey, repositorySlug, pullRequestsHistory.values[0].id);
        expect(activities).not.toHaveLength(0);

        const commits = await sut.getPullRequestCommits(projectKey, repositorySlug, pullRequestsHistory.values[0].id);
        expect(commits).not.toHaveLength(0);

        const diff = await sut.getPullRequestDiff(projectKey, repositorySlug, pullRequestsHistory.values[0].id);
        expect(diff).not.toBeFalsy();
    });
});