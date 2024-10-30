import { BitbucketAPI } from "./api/BitbucketAPI";
import { BitbucketPullRequest } from "./entities/BitbucketPullRequest";
import { MetricsDB } from "../MetricsDB/MetricsDB";
import { Repository } from "typeorm";
import { PullRequest } from "../MetricsDB/entities/PullRequest";
import { BitbucketPullRequestModel } from "./api/BitbucketAPI.contracts";

export type BitbucketProjectSettings = {
    projectKey: string;
    botUserSlugs: string[];
    formerEmployeeSlugs: string[];
    repositoriesSelector: (api: BitbucketAPI) => Promise<string[]>;
    pullRequestsFilterFn?: (pr: BitbucketPullRequestModel) => boolean,
    auth: {
        apiUrl: string;
        apiToken: string;
    }
}

export class BitbucketPullRequestsImporter {
    private readonly bitbucketAPI: BitbucketAPI;
    private readonly teamName: string;
    private readonly repository: Repository<PullRequest>;
    private readonly project: BitbucketProjectSettings;

    constructor(bitbucketAPI: BitbucketAPI, teamName: string, project: BitbucketProjectSettings) {
        this.bitbucketAPI = bitbucketAPI;
        this.project = project;
        this.repository = MetricsDB.getRepository(PullRequest);
        this.teamName = teamName;
    }

    async importPullRequests() {
        for (const repositoryName of await this.project.repositoriesSelector(this.bitbucketAPI)) {
            console.group(`🔁 Importing pull requests for '${repositoryName}' repository`);

            const timelogLabel = `✅ '${repositoryName}' pull requests import completed`;
            console.time(timelogLabel);
            await this.importRepositoryPullRequests(repositoryName);
            console.timeEnd(timelogLabel);

            console.groupEnd();
        }
    }


    /**
     * Unfortunately, the Bitbucket API 1.0 (used in on-prem versions) does not allow filtering or sorting pull requests by merge date.
     * This can result in data gaps when a pull request remains open for an extended period before being merged.
     * To avoid missing data, we retrieve all pull requests from the API each time.
     * This is typically isn't an issue since this is tens of thousands of pull requests at worst and the Bitbucket API performs well
     * However, if you encounter any problems, consider implementing a reverse import. Start with the most recent pull requests and process them in smaller chunks.
     */
    private async importRepositoryPullRequests(repositoryName: string) {
        const limit = 1000;
        const lastMergeDateOfStoredPRs: Date | null = await MetricsDB.getPRsMaxDate("mergedDate", this.teamName, this.project.projectKey, repositoryName);
        for (let start = 0; ; start += limit) {
            const timelogLabel = `💾 ${this.teamName}/${repositoryName}: successfully processed pull requests #${start}-${start + limit}.`;
            console.time(timelogLabel);

            const pullRequestsChunk = await this.bitbucketAPI.getMergedPullRequests(this.project.projectKey, repositoryName, start, limit);

            for (const pullRequest of pullRequestsChunk.values) {
                if (lastMergeDateOfStoredPRs != null && new Date(pullRequest.closedDate) <= lastMergeDateOfStoredPRs) {
                    continue;
                }

                if (!this.project.pullRequestsFilterFn || this.project.pullRequestsFilterFn(pullRequest)) {
                    await this.savePullRequest(this.project, repositoryName, pullRequest);
                } else {
                    console.warn(`⚠️ Pull request ${pullRequest.id} was filtered out by specified pullRequestsFilterFn function`);
                }
            }

            console.timeEnd(timelogLabel);

            if (pullRequestsChunk.isLastPage) {
                console.log(`That was the last chunk, exiting.`);
                break;
            }
        }
    }

    private async savePullRequest(project: BitbucketProjectSettings, repositoryName: string, pullRequest: BitbucketPullRequestModel) {
        const [activities, commits, diff] = await Promise.all([
            this.bitbucketAPI.getPullRequestActivities(project.projectKey, repositoryName, pullRequest.id),
            this.bitbucketAPI.getPullRequestCommits(project.projectKey, repositoryName, pullRequest.id),
            this.bitbucketAPI.getPullRequestDiff(project.projectKey, repositoryName, pullRequest.id)
        ]);

        const pullRequestEntity = await new BitbucketPullRequest().init({
                teamName: this.teamName,
                botUserSlugs: project.botUserSlugs,
                formerEmployeeSlugs: project.formerEmployeeSlugs,
                pullRequest,
                pullRequestActivities: activities,
                commits,
                diff
            }
        );
        await this.repository.save(pullRequestEntity);
    }
}
