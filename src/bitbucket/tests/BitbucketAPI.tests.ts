import { BitbucketAPI } from '../BitbucketAPI';
import { AppConfig } from "../../app.config";
import { PullRequest } from "../../metrics-db/PullRequest";
import { Utils } from "../../metrics-db/Utils";

describe('BitbucketAPI 𝑰𝒏𝒕𝒆𝒈𝒓𝒂𝒕𝒊𝒐𝒏 Test', () => {
    it.skip('should fetch pull requests history', async () => {
        const sut = new BitbucketAPI(AppConfig.Bitbucket.API_URL, AppConfig.Bitbucket.API_TOKEN);

        const projectKey = 'LPS';
        const repositorySlug = 'core.key-administrator';

        const pullRequestsHistory =await sut.getPullRequestsHistory(projectKey, repositorySlug)
        expect(pullRequestsHistory).not.toHaveLength(0);

        for (const pullRequest of pullRequestsHistory) {
            console.log(`Fetching pull request ${pullRequest.id}...`);
            const activities = await sut.getPullRequestActivities(projectKey, repositorySlug, pullRequest.id);
            expect(activities).not.toHaveLength(0);

            const commits = await sut.getPullRequestCommits(projectKey, repositorySlug, pullRequest.id);
            expect(commits).not.toHaveLength(0);

            const diff = await sut.getPullRequestDiff(projectKey, repositorySlug, pullRequest.id);
            expect(diff).not.toBeFalsy();
            const teamTraits = {
                teamName: "TEST",
                botUsers: ["bot.user"],
                formerEmployees: ["former.user"],
                testsWereTouched: Utils.Bitbucket.defaultTestsWereTouchedDetector(diff)
            }

            const entity = PullRequest.fromBitbucket(teamTraits, pullRequest, activities, commits, diff);
            expect(entity).not.toBeFalsy();
        }
    }, 60*60*1000);
});