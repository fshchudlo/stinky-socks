import { BitbucketAPI } from "./api/BitbucketAPI";
import { BitbucketPullRequest } from "./entities/BitbucketPullRequest";
import { MetricsDB } from "../metricsDB";
import { Repository } from "typeorm";
import { PullRequest } from "../metrics-db/PullRequest";

export type BitbucketProjectSettings = {
    projectKey: string;
    botUserNames: string[];
    formerEmployeeNames: string[];
    repositoriesSelector: (api: BitbucketAPI) => Promise<string[]>;
    pullRequestsFilterFn: (pr: any) => boolean
}

export class BitbucketPullRequestsImporter {
    private readonly bitbucketAPI: BitbucketAPI;
    private readonly teamName: string;
    private readonly repository: Repository<PullRequest>;
    private readonly projects: BitbucketProjectSettings[];

    constructor(bitbucketAPI: BitbucketAPI, teamName: string, projects: BitbucketProjectSettings[]) {
        this.bitbucketAPI = bitbucketAPI;
        this.projects = projects;
        this.repository = MetricsDB.getRepository(PullRequest);
        this.teamName = teamName;
    }

    async importPullRequests() {
        for (const project of this.projects) {
            console.group();
            console.log(`🔁 Importing pull requests for '${project.projectKey}' project`);

            for (const repositoryName of await project.repositoriesSelector(this.bitbucketAPI)) {
                console.group();
                console.log(`🔁 Importing pull requests for '${repositoryName}' repository`);

                const timelogLabel = `✅ '${repositoryName}' pull requests import completed`;
                console.time(timelogLabel);
                await this.importRepositoryPullRequests(project, repositoryName);
                console.timeEnd(timelogLabel);

                console.groupEnd();
            }
            console.groupEnd();
        }
    }


    /**
     * Unfortunately, the Bitbucket API does not allow filtering or sorting pull requests by merge date.
     * This can result in data gaps when a pull request remains open for an extended period before being merged.
     * To avoid missing data, we retrieve all pull requests from the API each time.
     * This is typically isn't an issue since this is tens of thousands of pull requests at worst and the Bitbucket API performs well
     * However, if you encounter any problems, consider implementing a reverse import. Start with the most recent pull requests and process them in smaller chunks.
     */
    private async importRepositoryPullRequests(project: BitbucketProjectSettings, repositoryName: string) {
        console.group();
        const limit = 1000;
        const lastMergeDateOfStoredPRs: Date | null = await this.getPRsCountAndLastMergeDate(project, repositoryName);
        for (let start = 0; ; start += limit) {
            const pullRequestsResponse = await this.bitbucketAPI.getMergedPullRequests(project.projectKey, repositoryName, start, limit);

            for (const bitbucketPullRequest of pullRequestsResponse.values.filter((pr: any) => lastMergeDateOfStoredPRs == null || new Date(pr.closedDate) > lastMergeDateOfStoredPRs)) {
                if (project.pullRequestsFilterFn(bitbucketPullRequest)) {
                    await this.savePullRequest(project, repositoryName, bitbucketPullRequest);
                    console.count("🤞 Pull requests processed");
                } else {
                    console.warn(`⚠️ Pull request ${bitbucketPullRequest.id} was filtered out by specified pullRequestsFilterFn function`);
                }
            }

            if (pullRequestsResponse.isLastPage) {
                break;
            }
        }
        console.groupEnd();
    }

    private async savePullRequest(project: BitbucketProjectSettings, repositoryName: string, pullRequest: any) {
        const [activities, commits, diff] = await Promise.all([
            this.bitbucketAPI.getPullRequestActivities(project.projectKey, repositoryName, pullRequest.id),
            this.bitbucketAPI.getPullRequestCommits(project.projectKey, repositoryName, pullRequest.id),
            this.bitbucketAPI.getPullRequestDiff(project.projectKey, repositoryName, pullRequest.id)
        ]);

        const pullRequestEntity = new BitbucketPullRequest({
                teamName: this.teamName,
                botUsers: project.botUserNames,
                formerEmployees: project.formerEmployeeNames,
                pullRequest,
                pullRequestActivities: activities,
                commits,
                diff
            }
        );
        await this.repository.save(pullRequestEntity);
    }

    private async getPRsCountAndLastMergeDate(project: BitbucketProjectSettings, repositorySlug: string) {
        return (await this.repository
            .createQueryBuilder("pr")
            .select("MAX(pr.mergedDate)", "maxMergeDate")
            .where("pr.teamName = :teamName", { teamName: this.teamName })
            .andWhere("pr.projectKey = :projectKey", { projectKey: project.projectKey })
            .andWhere("pr.repositoryName = :repositoryName", { repositoryName: repositorySlug })
            .getRawOne())?.maxMergeDate || null;
    }
}
