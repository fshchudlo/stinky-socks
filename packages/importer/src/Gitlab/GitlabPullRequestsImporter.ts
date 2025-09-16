import { Repository } from "typeorm";
import { PullRequest } from "../MetricsDB/entities/PullRequest";
import { MetricsDB } from "../MetricsDB/MetricsDB";
import { GitlabAPI } from "./api/GitlabAPI";
import { GitlabNamespaceModel, GitlabProjectModel, GitlabPullRequestModel } from "./GitlabAPI.contracts";
import { GitlabPullRequest } from "./entities/GitlabPullRequest";
import normalizeGitlabPayload from "./entities/helpers/normalizeGitlabPayload";

type teamNameResolverFn = (project: GitlabProjectModel, pr: GitlabPullRequestModel) => string;

export class GitlabPullRequestsImporter {
    private readonly gitlabAPI: GitlabAPI;
    private readonly project: GitlabNamespaceModel;
    private readonly repository: Repository<PullRequest>;
    private readonly teamNameResolverFn: teamNameResolverFn;

    constructor(gitlabAPI: GitlabAPI, project: GitlabNamespaceModel, teamNameResolverFn: teamNameResolverFn) {
        this.gitlabAPI = gitlabAPI;
        this.project = project;
        this.teamNameResolverFn = teamNameResolverFn;
        this.repository = MetricsDB.getRepository(PullRequest);
    }

    async importPullRequests() {
        const repositories = await this.gitlabAPI.getNamespaceProjects(this.project.id);

        for (const gitlabRepository of repositories) {
            console.group(`🔁 Importing pull requests for the '${gitlabRepository.path_with_namespace}' repository`);

            const timelogLabel = `✅ '${gitlabRepository.path_with_namespace}' pull requests import completed`;
            console.time(timelogLabel);
            await this.importRepositoryPullRequests(gitlabRepository);
            console.timeEnd(timelogLabel);

            console.groupEnd();
        }
    }

    private async importRepositoryPullRequests(gitlabRepository: GitlabProjectModel) {
        const importedPRsCount = await MetricsDB.getPRsCount(gitlabRepository.namespace.name, gitlabRepository.namespace.name, gitlabRepository.name);
        const lastUpdateDateOfStoredPRs: Date | null = await MetricsDB.getPRsMaxDate("updatedDate", gitlabRepository.namespace.name, gitlabRepository.namespace.name, gitlabRepository.name);

        const pageSize = 100;
        let pageNumber = importedPRsCount > pageSize ? Math.floor(importedPRsCount / pageSize) : 1;

        while (true) {
            const timelogLabel = `💾 ${gitlabRepository.path_with_namespace}: successfully processed pull requests #${(pageSize * (pageNumber - 1)).toLocaleString()}-${(pageSize * pageNumber).toLocaleString()}.`;
            console.time(timelogLabel);

            const pullRequestsChunk = await this.gitlabAPI.getMergedMergeRequests(gitlabRepository.id, pageNumber, pageSize);

            for (const pullRequest of pullRequestsChunk) {
                if (lastUpdateDateOfStoredPRs != null && new Date(pullRequest.updated_at) <= lastUpdateDateOfStoredPRs) {
                    continue;
                }

                if (!pullRequest.merged_at) {
                    continue;
                }

                await this.savePullRequest(gitlabRepository, pullRequest);
            }
            console.timeEnd(timelogLabel);

            if (pullRequestsChunk.length < pageSize) {
                console.log(`The page #${pageNumber} was the last one, exiting.`);
                break;
            }
            pageNumber++;
        }
    }

    private async savePullRequest(repository: GitlabProjectModel, pullRequest: GitlabPullRequestModel) {
        try {
            const [commits, activities, changes] = await Promise.all([
                this.gitlabAPI.getMergeRequestCommits(repository.id, pullRequest.iid),
                this.gitlabAPI.getMergeRequestNotes(repository.id, pullRequest.iid),
                this.gitlabAPI.getMergeRequestChanges(repository.id, pullRequest.iid)
            ]);
            const pullRequestEntity = await new GitlabPullRequest().init(await normalizeGitlabPayload({
                    teamName: this.teamNameResolverFn ? this.teamNameResolverFn(repository, pullRequest) : repository.namespace.name,
                    pullRequest,
                    repository,
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

