import { GitHubAPI } from "./api/GitHubAPI";
import { Repository } from "typeorm";
import { PullRequest } from "../metrics-db/PullRequest";
import { MetricsDB } from "../metrics-db/MetricsDB";

export type GithubProjectSettings = {
    projectKey: string;
    botUserNames: string[];
    formerEmployeeNames: string[];
    repositoriesSelector: (api: GitHubAPI) => Promise<string[]>;
    pullRequestsFilterFn: (pr: any) => boolean,
    auth: {
        apiToken: string;
    }
}

export class GitHubPullRequestsImporter {
    private readonly gitHubAPI: GitHubAPI;
    private readonly teamName: string;
    private readonly repository: Repository<PullRequest>;
    private readonly project: GithubProjectSettings;

    constructor(gitHubAPI: GitHubAPI, teamName: string, project: GithubProjectSettings) {
        this.gitHubAPI = gitHubAPI;
        this.teamName = teamName;
        this.project = project;
        this.repository = MetricsDB.getRepository(PullRequest);
    }

    async importPullRequests() {
        for (const repositoryName of await this.project.repositoriesSelector(this.gitHubAPI)) {
            console.group();
            console.log(`🔁 Importing pull requests for '${repositoryName}' repository`);

            const timelogLabel = `✅ '${repositoryName}' pull requests import completed`;
            console.time(timelogLabel);
            await this.importRepositoryPullRequests(repositoryName);
            console.timeEnd(timelogLabel);

            console.groupEnd();
        }
    }

    private async importRepositoryPullRequests(repositoryName: string) {
        console.group();
        const pageSize = 100;
        let pageNumber = 1;
        const lastMergeDateOfStoredPRs: Date | null = await MetricsDB.getPRsCountAndLastMergeDate(this.teamName, this.project.projectKey, repositoryName);
        while (true) {
            const pullRequestsChunk = await this.gitHubAPI.getMergedPullRequests(this.project.projectKey, repositoryName, pageNumber, pageSize);

            for (const pullRequest of pullRequestsChunk.filter((pr: any) => lastMergeDateOfStoredPRs == null || new Date(pr.closedDate) > lastMergeDateOfStoredPRs)) {
                if (this.project.pullRequestsFilterFn(pullRequest)) {
                    await this.savePullRequest(this.project, repositoryName, pullRequest);
                } else {
                    console.warn(`⚠️ Pull request ${pullRequest.id} was filtered out by specified pullRequestsFilterFn function`);
                }
            }

            if (pullRequestsChunk.length < pageSize) {
                break;
            }
            pageNumber++;
        }
        console.groupEnd();
    }

    private async savePullRequest(project: GithubProjectSettings, repositoryName: string, pullRequest: any) {
        throw new Error(`Method not implemented. ${project}, ${repositoryName}, ${pullRequest}`);
    }
}