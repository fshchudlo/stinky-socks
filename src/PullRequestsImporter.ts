import { BitbucketAPI } from "./bitbucket/BitbucketAPI";
import { TeamImportSettings, TeamProjectSettings } from "./typings";
import { PullRequest } from "./metrics-db/PullRequest";
import { MetricsDB } from "./metricsDB";
import { Repository } from "typeorm";

export class PullRequestsImporter {
    private readonly bitbucketAPI: BitbucketAPI;
    private readonly teams: TeamImportSettings[];
    private readonly repository: Repository<PullRequest>;

    constructor(bitbucketAPI: BitbucketAPI, teams: TeamImportSettings[]) {
        this.bitbucketAPI = bitbucketAPI;
        this.repository = MetricsDB.getRepository(PullRequest);
        this.teams = teams;
    }

    async importPullRequests() {
        for (const team of this.teams) {
            for (const project of team.projects) {
                for (const repositoryName of await project.repositoriesSelector(this.bitbucketAPI)) {
                    await this.importRepositoryPullRequests(team, project, repositoryName);
                }
            }
        }
    }

    private async importRepositoryPullRequests(team: TeamImportSettings, project: TeamProjectSettings, repositoryName: string) {
        console.log(`\tStarting import of ${team.teamName} ${project.projectKey} ${repositoryName}...`);

        let start = 0;
        const limit = 1;
        const lastMergeDateOfStoredPRs: Date | null = await this.getLastMergeDateOfStoredPRs(team, project, repositoryName);

        while (true) {
            const bitbucketPullRequests = await this.bitbucketAPI.getMergedPullRequests(project.projectKey, repositoryName, start, limit);
            if (bitbucketPullRequests.length === 0) {
                break;
            }

            for (const bitbucketPullRequest of bitbucketPullRequests) {

                if (lastMergeDateOfStoredPRs && lastMergeDateOfStoredPRs >= new Date(bitbucketPullRequest.closedDate)) {
                    continue;
                }

                await this.savePullRequest(team, project, repositoryName, bitbucketPullRequest);
            }

            start += limit;
        }
        console.log(`\tImport of ${team.teamName} ${project.projectKey} ${repositoryName} completed`);
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
            console.log(`\t\tNo commits found for PR ${pullRequest.id}`);
            return;
        }

        const pullRequestEntity = PullRequest.fromBitbucket({
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

    private async getLastMergeDateOfStoredPRs(team: TeamImportSettings, project: TeamProjectSettings, repositorySlug: string) {
        return (await this.repository
            .createQueryBuilder("pr")
            .select("MAX(pr.mergedDate)", "maxMergeDate")
            .where("pr.teamName = :teamName", { teamName: team.teamName })
            .andWhere("pr.projectKey = :projectKey", { projectKey: project.projectKey })
            .andWhere("pr.repositoryName = :repositoryName", { repositoryName: repositorySlug })
            .getRawOne())?.maxMergeDate || null;
    }
}
