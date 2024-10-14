import { BitbucketAPI } from "./bitbucket/BitbucketAPI";
import { TeamImportSettings, TeamProjectSettings } from "./typings";
import { PullRequest } from "./metrics-db/PullRequest";
import { MetricsDB } from "./metricsDB";

export class PullRequestsImporter {
    private readonly bitbucketAPI: BitbucketAPI;
    private readonly teams: TeamImportSettings[];

    constructor(bitbucketAPI: BitbucketAPI, teams: TeamImportSettings[]) {
        this.bitbucketAPI = bitbucketAPI;
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
        const repository = MetricsDB.getRepository(PullRequest);
        const pullRequestsData = await this.bitbucketAPI.getPullRequestsHistory(project.projectKey, repositoryName);
        const lastMergeDateOfStoredPRs: Date | null = await this.getLastMergeDateOfStoredPRs(team, project, repositoryName);

        for (const pullRequestData of pullRequestsData) {
            if (lastMergeDateOfStoredPRs && lastMergeDateOfStoredPRs >= new Date(pullRequestData.closedDate)) {
                continue;
            }
            const [activities, commits, diff] = await Promise.all([
                this.bitbucketAPI.getPullRequestActivities(project.projectKey, repositoryName, pullRequestData.id),
                this.bitbucketAPI.getPullRequestCommits(project.projectKey, repositoryName, pullRequestData.id),
                this.bitbucketAPI.getPullRequestDiff(project.projectKey, repositoryName, pullRequestData.id)
            ]);

            const pullRequestEntity = PullRequest.fromBitbucket({
                    teamName: team.teamName,
                    botUsers: project.botUsers,
                    formerEmployees: team.formerEmployees,
                    pullRequest: pullRequestData,
                    pullRequestActivities: activities,
                    commits,
                    diff
                }
            );
            await repository.save(pullRequestEntity);
        }
        console.log(`\tImport of ${team.teamName} ${project.projectKey} ${repositoryName} completed`);
    }

    private async getLastMergeDateOfStoredPRs(team: TeamImportSettings, project: TeamProjectSettings, repositorySlug: string) {
        return (await MetricsDB.getRepository(PullRequest)
            .createQueryBuilder("pr")
            .select("MAX(pr.mergedDate)", "maxMergeDate")
            .where("pr.teamName = :teamName", { teamName: team.teamName })
            .andWhere("pr.projectKey = :projectKey", { projectKey: project.projectKey })
            .andWhere("pr.repositoryName = :repositoryName", { repositoryName: repositorySlug })
            .getRawOne())?.maxMergeDate || null;
    }
}
