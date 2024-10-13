import { BitbucketAPI } from '../BitbucketAPI';
import { AppConfig } from "../../app.config";

describe('BitbucketAPI 𝑰𝒏𝒕𝒆𝒈𝒓𝒂𝒕𝒊𝒐𝒏 Tests', () => {
    it.skip('should fetch pull requests history', async () => {
        const sut = new BitbucketAPI(AppConfig.Bitbucket.API_URL, AppConfig.Bitbucket.API_TOKEN);

        const projectKey = 'TEST';
        const repositorySlug = 'test-repository';

        const pullRequestsHistory =await sut.getPullRequestsHistory(projectKey, repositorySlug)
        expect(pullRequestsHistory).not.toHaveLength(0);

        const activities = await sut.getPullRequestActivities(projectKey, repositorySlug, pullRequestsHistory[0].id);
        expect(activities).not.toHaveLength(0);

        const commits = await sut.getPullRequestCommits(projectKey, repositorySlug, pullRequestsHistory[0].id);
        expect(commits).not.toHaveLength(0);

        const diff = await sut.getPullRequestCommits(projectKey, repositorySlug, pullRequestsHistory[0].id);
        expect(diff).not.toHaveLength(0);
    });
});