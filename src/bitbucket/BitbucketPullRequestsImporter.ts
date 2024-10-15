import { BitbucketAPI } from "./BitbucketAPI";
import { TeamImportSettings, TeamProjectSettings } from "../typings";
import { BitbucketPullRequest } from "./BitbucketPullRequest";
import { MetricsDB } from "../metricsDB";
import { Repository } from "typeorm";
import { PullRequest } from "../metrics-db/PullRequest";

export class BitbucketPullRequestsImporter {
    private readonly bitbucketAPI: BitbucketAPI;
    private readonly teams: TeamImportSettings[];
    private readonly repository: Repository<PullRequest>;

    constructor(bitbucketAPI: BitbucketAPI, teams: TeamImportSettings[]) {
        this.bitbucketAPI = bitbucketAPI;
        this.repository = MetricsDB.getRepository(PullRequest);
        this.teams = teams;
    }

    async importPullRequests() {
        console.group();
        for (const team of this.teams) {
            console.log(`🔁 Importing pull requests for '${team.teamName}' team`);

            for (const project of team.projects) {
                console.group();
                console.log(`🔁 Importing pull requests for '${project.projectKey}' project`);

                for (const repositoryName of await project.repositoriesSelector(this.bitbucketAPI)) {
                    console.group();
                    console.log(`🔁 Importing pull requests for '${repositoryName}' repository`);

                    const timelogLabel = `✅ '${repositoryName}' pull requests import completed`;
                    console.time(timelogLabel);
                    await this.importRepositoryPullRequests(team, project, repositoryName);
                    console.timeEnd(timelogLabel);

                    console.groupEnd();
                }
                console.groupEnd();
            }
        }
        console.groupEnd();
    }


    /**
     * Unfortunately, the Bitbucket API does not allow filtering or sorting pull requests by merge date.
     * This can result in data gaps when a pull request remains open for an extended period before being merged.
     * To avoid missing data, we retrieve all pull requests from the API each time.
     * This is typically isn't an issue since this is tens of thousands of pull requests at worst and the Bitbucket API performs well
     * However, if you encounter any problems, consider implementing a reverse import. Start with the most recent pull requests and process them in smaller chunks.
     */
    private async importRepositoryPullRequests(team: TeamImportSettings, project: TeamProjectSettings, repositoryName: string) {
        console.group();
        const limit = 1000;
        const lastMergeDateOfStoredPRs: Date | null = await this.getPRsCountAndLastMergeDate(team, project, repositoryName);
        for (let start = 0; ; start += limit) {
            const pullRequestsResponse = await this.bitbucketAPI.getMergedPullRequests(project.projectKey, repositoryName, start, limit);

            for (const bitbucketPullRequest of pullRequestsResponse.values.filter((pr: any) => lastMergeDateOfStoredPRs == null || new Date(pr.closedDate) > lastMergeDateOfStoredPRs)) {
                await this.savePullRequest(team, project, repositoryName, bitbucketPullRequest);
                console.count("🤞 Pull requests processed");
            }

            if (pullRequestsResponse.isLastPage) {
                break;
            }
        }
        console.groupEnd();
    }

    private async savePullRequest(team: TeamImportSettings, project: TeamProjectSettings, repositoryName: string, pullRequest: any) {
        const [activities, commits, diff] = await Promise.all([
            this.bitbucketAPI.getPullRequestActivities(project.projectKey, repositoryName, pullRequest.id),
            this.bitbucketAPI.getPullRequestCommits(project.projectKey, repositoryName, pullRequest.id),
            this.bitbucketAPI.getPullRequestDiff(project.projectKey, repositoryName, pullRequest.id)
        ]);

        /* I'm not sure why, but I've encountered pull requests (PRs) without any commits.
        * It could have been due to invalid imports or some other issue.
        * Regardless, this is such a rare case that it can be safely ignored without compromising data integrity.
        */
        if (commits.length == 0) {
            console.warn(`No commits found for PR ${pullRequest.id}`);
            return;
        }

        const pullRequestEntity = new BitbucketPullRequest({
                teamName: team.teamName,
                botUsers: project.botUserNames,
                formerEmployees: team.formerEmployeeNames,
                pullRequest,
                pullRequestActivities: activities,
                commits,
                diff
            }
        );
        await this.repository.save(pullRequestEntity);
    }

    private async getPRsCountAndLastMergeDate(team: TeamImportSettings, project: TeamProjectSettings, repositorySlug: string) {
        return (await this.repository
            .createQueryBuilder("pr")
            .select("MAX(pr.mergedDate)", "maxMergeDate")
            .where("pr.teamName = :teamName", { teamName: team.teamName })
            .andWhere("pr.projectKey = :projectKey", { projectKey: project.projectKey })
            .andWhere("pr.repositoryName = :repositoryName", { repositoryName: repositorySlug })
            .getRawOne())?.maxMergeDate || null;
    }
}
