import "dotenv/config";
import {gitlabProjectsImportConfig} from "../../../gitlabProjectsImportConfig";
import { GitlabAPI } from "../GitlabAPI";

describe("GitlabAPI 𝑰𝒏𝒕𝒆𝒈𝒓𝒂𝒕𝒊𝒐𝒏 Test", () => {
    it.skip("should fetch pull requests history", async () => {
        const sut = new GitlabAPI(gitlabProjectsImportConfig.url, gitlabProjectsImportConfig.apiToken);

        const projects = await sut.getNamespaces(gitlabProjectsImportConfig.namespaceSearch);
        expect(projects).not.toHaveLength(0);

        const repositories = await sut.getNamespaceProjects(projects[0].id);
        expect(repositories).not.toHaveLength(0);

        const pullRequestsHistory = await sut.getMergedMergeRequests(repositories[0].id, 1, 10);
        expect(pullRequestsHistory).not.toHaveLength(0);


        const pullRequestsFiles = await sut.getMergeRequestChanges(repositories[0].id, pullRequestsHistory[0].iid);
        expect(pullRequestsFiles).not.toHaveLength(0);

        const pullRequestsActivities = await sut.getMergeRequestNotes(repositories[0].id, pullRequestsHistory[0].iid);
        expect(pullRequestsActivities).not.toHaveLength(0);

        const pullRequestsCommits = await sut.getMergeRequestCommits(repositories[0].id, pullRequestsHistory[0].iid);
        expect(pullRequestsCommits).not.toHaveLength(0);

    });
});