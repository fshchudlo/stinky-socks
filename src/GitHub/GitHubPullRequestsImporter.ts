import { GitHubAPI } from "./api/GitHubAPI";
import { Repository } from "typeorm";
import { PullRequest } from "../MetricsDB/entities/PullRequest";
import { MetricsDB } from "../MetricsDB/MetricsDB";
import { GitHubPullRequest } from "./entities/GitHubPullRequest";
import { GitHubPullRequestModel, GitHubUserModel } from "./api/GitHubAPI.contracts";
import { ImportParams } from "./entities/ImportParams";

export type GitHubProjectSettings = {
    owner: string;
    botUserNames: string[];
    formerEmployeeNames: string[];
    repositoriesSelector: (api: GitHubAPI) => Promise<string[]>;
    pullRequestsFilterFn?: (pr: GitHubPullRequestModel) => boolean,
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
        const lastUpdateDateOfStoredPRs: Date | null = await MetricsDB.getPRsMaxDate("updatedDate", this.teamName, this.project.owner, repositoryName);
        const importedPRsCount = await MetricsDB.getPRsCount(this.teamName, this.project.owner, repositoryName);
        let pageNumber = importedPRsCount > pageSize ? Math.floor(importedPRsCount / pageSize) : 1;

        while (true) {
            const timelogLabel = `💾 ${this.teamName}/${repositoryName}: successfully processed pull requests #${(pageSize * (pageNumber - 1)).toLocaleString()}-${(pageSize * pageNumber).toLocaleString()}.`;
            console.time(timelogLabel);

            const pullRequestsChunk = await this.gitHubAPI.getClosedPullRequests(this.project.owner, repositoryName, pageNumber, pageSize);
            for (const pullRequest of pullRequestsChunk) {
                if (lastUpdateDateOfStoredPRs != null && new Date(pullRequest.updated_at) <= lastUpdateDateOfStoredPRs) {
                    continue;
                }

                if (!pullRequest.merged_at) {
                    continue;
                }

                if (!this.project.pullRequestsFilterFn || this.project.pullRequestsFilterFn(pullRequest)) {
                    await this.savePullRequest(this.project, repositoryName, pullRequest);
                } else {
                    console.warn(`⚠️ Pull request ${pullRequest.number} was filtered out by specified pullRequestsFilterFn function`);
                }
            }
            console.timeEnd(timelogLabel);

            if (pullRequestsChunk.length < pageSize) {
                console.log(`The page #${pageNumber} was the last one, exiting.`);
                break;
            }
            pageNumber++;
        }
    }

    private async savePullRequest(project: GitHubProjectSettings, repositoryName: string, pullRequest: GitHubPullRequestModel) {
        try {
            const [activities, files] = await Promise.all([
                this.gitHubAPI.getPullRequestActivities(project.owner, repositoryName, pullRequest.number),
                this.gitHubAPI.getPullRequestFiles(project.owner, repositoryName, pullRequest.number)
            ]);
            const pullRequestEntity = await new GitHubPullRequest().init(this.sanitize({
                    teamName: this.teamName,
                    botUserNames: project.botUserNames,
                    formerEmployeeNames: project.formerEmployeeNames,
                    pullRequest,
                    pullRequestActivities: activities,
                    files
                })
            );
            await this.repository.save(pullRequestEntity);
        } catch (error) {
            console.error(`❌ Error while saving pull request ${pullRequest.html_url}: ${error}`);
            throw error;
        }
    }

    private sanitize(model: ImportParams) {
        model.pullRequest.user.login = sanitizeUserLogin(model.pullRequest.user);

        for (const reviewer of model.pullRequest.requested_reviewers) {
            reviewer.login = sanitizeUserLogin(reviewer);
        }
        for (const assignee of model.pullRequest.assignees) {
            assignee.login = sanitizeUserLogin(assignee);
        }
        for (const activity of model.pullRequestActivities) {
            const anyActivity = activity as any;

            if (anyActivity.comments?.user) {
                anyActivity.comments.user.login = sanitizeUserLogin(anyActivity.comments.user);
            }
            if (anyActivity.user) {
                anyActivity.user.login = sanitizeUserLogin(anyActivity.user);
            }
            if (anyActivity.actor) {
                anyActivity.actor.login = sanitizeUserLogin(anyActivity.actor);
            }
            if (anyActivity.requested_reviewer) {
                anyActivity.requested_reviewer.login = sanitizeUserLogin(anyActivity.requested_reviewer);
            }
        }
        return model;
    }
}

function sanitizeUserLogin(user: GitHubUserModel): string;
function sanitizeUserLogin(user: GitHubUserModel | undefined): string | null {
    // If the user is mannequin (e.g. data was imported from other SCM), the login will contain GUID and the only way to extract real login is to parse it from the html_url
    return user?.type == "Mannequin" ? user.html_url.replace("https://github.com/", "") : user?.login || null;
}