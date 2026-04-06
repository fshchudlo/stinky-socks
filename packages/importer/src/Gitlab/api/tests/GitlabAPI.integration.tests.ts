import "dotenv/config";
import {gitlabProjectsImportConfig} from "../../../gitlabProjectsImportConfig";
import { GitlabAPI } from "../GitlabAPI";

describe("GitlabAPI 𝑰𝒏𝒕𝒆𝒈𝒓𝒂𝒕𝒊𝒐𝒏 Test", () => {
    it.skip("should fetch pull requests history", async () => {
        const sut = new GitlabAPI(gitlabProjectsImportConfig.url, gitlabProjectsImportConfig.apiToken);

        const repositories = await sut.getProjects(gitlabProjectsImportConfig.projectSearch);
        expect(repositories).not.toHaveLength(0);

        const pullRequestsHistory = await sut.getMergedMergeRequests(repositories[0].id, 1, 10);
        expect(pullRequestsHistory).not.toHaveLength(0);

        const pullRequest = await sut.getMergeRequest(repositories[0].id, pullRequestsHistory[0].iid);
        expect(pullRequest).not.toBeFalsy();


        const pullRequestsFiles = await sut.getMergeRequestChanges(repositories[0].id, pullRequest.iid);
        expect(pullRequestsFiles).not.toHaveLength(0);

        const pullRequestsActivities = await sut.getMergeRequestNotes(repositories[0].id, pullRequest.iid);
        expect(pullRequestsActivities).not.toHaveLength(0);

        const pullRequestsCommits = await sut.getMergeRequestCommits(repositories[0].id, pullRequest.iid);
        expect(pullRequestsCommits).not.toHaveLength(0);

    });
});
