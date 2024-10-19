import { GitHubAPI, GitHubPullRequestModel } from "./api/GitHubAPI";
import { Repository } from "typeorm";
import { PullRequest } from "../MetricsDB/PullRequest";
import { MetricsDB } from "../MetricsDB/MetricsDB";
import { GitHubPullRequest } from "./entities/GitHubPullRequest";

export type GitHubProjectSettings = {
    owner: string;
    botUserNames: string[];
    formerEmployeeNames: string[];
    repositoriesSelector: (api: GitHubAPI) => Promise<string[]>;
    pullRequestsFilterFn: (pr: GitHubPullRequestModel) => boolean,
    auth: {
        apiToken: string;
    }
}

export class GitHubPullRequestsImporter {
    private readonly gitHubAPI: GitHubAPI;
    private readonly teamName: string;
    private readonly repository: Repository<PullRequest>;
    private readonly project: GitHubProjectSettings;

    constructor(gitHubAPI: GitHubAPI, teamName: string, project: GitHubProjectSettings) {
        this.gitHubAPI = gitHubAPI;
        this.teamName = teamName;
        this.project = project;
        this.repository = MetricsDB.getRepository(PullRequest);
    }

    async importPullRequests() {
        for (const repositoryName of await this.project.repositoriesSelector(this.gitHubAPI)) {
            console.group(`🔁 Importing pull requests for '${repositoryName}' repository`);

            const timelogLabel = `✅ '${repositoryName}' pull requests import completed`;
            console.time(timelogLabel);
            await this.importRepositoryPullRequests(repositoryName);
            console.timeEnd(timelogLabel);

            console.groupEnd();
        }
    }

    private async importRepositoryPullRequests(repositoryName: string) {
        const pageSize = 100;
        let pageNumber = 1;
        const lastMergeDateOfStoredPRs: Date | null = await MetricsDB.getPRsCountAndLastMergeDate(this.teamName, this.project.owner, repositoryName);
        while (true) {
            const pullRequestsChunk = await this.gitHubAPI.getClosedPullRequests(this.project.owner, repositoryName, pageNumber, pageSize);

            for (const pullRequest of pullRequestsChunk) {
                console.count(`📥 ${repositoryName}: pull requests processed`);
                if (!pullRequest.merged_at) {
                    continue;
                }
                if (lastMergeDateOfStoredPRs != null && new Date(pullRequest.merged_at) <= lastMergeDateOfStoredPRs) {
                    continue;
                }

                if (this.project.pullRequestsFilterFn(pullRequest)) {
                    await this.savePullRequest(this.project, repositoryName, pullRequest);
                } else {
                    console.warn(`⚠️ Pull request ${pullRequest.number} was filtered out by specified pullRequestsFilterFn function`);
                }
            }

            if (pullRequestsChunk.length < pageSize) {
                console.countReset(`📥 ${repositoryName}: pull requests processed`);
                break;
            }
            pageNumber++;
        }
    }

    private async savePullRequest(project: GitHubProjectSettings, repositoryName: string, pullRequest: GitHubPullRequestModel) {
        const [activities, files] = await Promise.all([
            this.gitHubAPI.getPullRequestActivities(project.owner, repositoryName, pullRequest.number),
            this.gitHubAPI.getPullRequestFiles(project.owner, repositoryName, pullRequest.number)
        ]);
        const pullRequestEntity = await new GitHubPullRequest().init({
                teamName: this.teamName,
                botUserNames: project.botUserNames,
                formerEmployeeNames: project.formerEmployeeNames,
                pullRequest,
                pullRequestActivities: activities,
                files
            }
        );
        await this.repository.save(pullRequestEntity);
    }
}