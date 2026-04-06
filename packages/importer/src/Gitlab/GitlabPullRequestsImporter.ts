import { Repository } from "typeorm";
import { PullRequest } from "../MetricsDB/entities/PullRequest";
import { MetricsDB } from "../MetricsDB/MetricsDB";
import { GitlabAPI } from "./api/GitlabAPI";
import { GitlabProjectModel, GitlabPullRequestModel } from "./GitlabAPI.contracts";
import { GitlabPullRequest } from "./entities/GitlabPullRequest";
import normalizeGitlabPayload from "./entities/helpers/normalizeGitlabPayload";
import { teamNameResolverFn } from "./entities/ImportParams";

export class GitlabPullRequestsImporter {
    private readonly gitlabAPI: GitlabAPI;
    private readonly projectSearch: string | undefined;
    private readonly repository: Repository<PullRequest>;
    private readonly teamNameResolverFn: teamNameResolverFn;

    constructor(gitlabAPI: GitlabAPI, projectSearch: string | undefined, teamNameResolverFn: teamNameResolverFn) {
        this.gitlabAPI = gitlabAPI;
        this.projectSearch = projectSearch;
        this.teamNameResolverFn = teamNameResolverFn;
        this.repository = MetricsDB.getRepository(PullRequest);
    }

    async importPullRequests() {
        const projects = await this.gitlabAPI.getProjects(this.projectSearch);

        for (const project of projects.filter(r => r.name === this.projectSearch)) {
            console.group(`🔁 Importing pull requests for the '${project.path_with_namespace}' repository`);

            const timelogLabel = `✅ '${project.path_with_namespace}' pull requests import completed`;
            console.time(timelogLabel);
            await this.importProjectPullRequests(project);
            console.timeEnd(timelogLabel);

            console.groupEnd();
        }
    }

    private async importProjectPullRequests(gitlabProject: GitlabProjectModel) {
        const importedPRsCount = await MetricsDB.getPRsCount(gitlabProject.namespace.name, gitlabProject.name, null);
        const lastUpdateDateOfStoredPRs: Date | null = await MetricsDB.getPRsMaxDate("updatedDate", gitlabProject.namespace.name, gitlabProject.namespace.name, gitlabProject.name);

        const pageSize = 100;
        let pageNumber = importedPRsCount > pageSize ? Math.floor(importedPRsCount / pageSize) : 1;

        while (true) {
            const timelogLabel = `💾 ${gitlabProject.path_with_namespace}: successfully processed pull requests #${(pageSize * (pageNumber - 1)).toLocaleString()}-${(pageSize * pageNumber).toLocaleString()}.`;
            console.time(timelogLabel);

            const pullRequestsChunk = await this.gitlabAPI.getMergedMergeRequests(gitlabProject.id, pageNumber, pageSize);

            for (const pullRequest of pullRequestsChunk) {
                if (lastUpdateDateOfStoredPRs != null && new Date(pullRequest.updated_at) <= lastUpdateDateOfStoredPRs) {
                    continue;
                }

                if (!pullRequest.merged_at) {
                    continue;
                }

                await this.savePullRequest(gitlabProject, pullRequest);
            }
            console.timeEnd(timelogLabel);

            if (pullRequestsChunk.length < pageSize) {
                console.log(`The page #${pageNumber} was the last one, exiting.`);
                break;
            }
            pageNumber++;
        }
    }

    private async savePullRequest(project: GitlabProjectModel, pullRequest: GitlabPullRequestModel) {
        try {
            const [commits, activities, changes] = await Promise.all([
                this.gitlabAPI.getMergeRequestCommits(project.id, pullRequest.iid),
                this.gitlabAPI.getMergeRequestNotes(project.id, pullRequest.iid),
                this.gitlabAPI.getMergeRequestChanges(project.id, pullRequest.iid)
            ]);
            const pullRequestEntity = await new GitlabPullRequest().init(await normalizeGitlabPayload({
                    teamName: this.teamNameResolverFn ? this.teamNameResolverFn(project, pullRequest.author.id) : project.namespace.name,
                    teamNameResolverFn:this.teamNameResolverFn,
                    pullRequest,
                    repository: project,
                    commits,
                    activities,
                    changes
                }, this.gitlabAPI)
            );

            const integrityErrors = pullRequestEntity.validateDataIntegrity();
            if (integrityErrors.length > 0) {
                console.warn(`☣️ PullRequest ${pullRequest.web_url} has the following integrity errors:\n\t• ${integrityErrors.join("\n\t• ")}`);
            }
            await this.repository.save(pullRequestEntity);
        } catch (error) {
            console.error(`❌ Error while saving pull request ${pullRequest.web_url}: ${error}`);
            throw error;
        }
    }
}
