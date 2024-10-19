import { PullRequest } from "../../MetricsDB/PullRequest";
import getHumanComments from "./getHumanComments";
import { GitHubPullRequestParticipant } from "./GitHubPullRequestParticipant";
import { GitHubFileModel, GitHubPullRequestActivityModel, GitHubPullRequestModel } from "../api/GitHubAPI";
import { ContributorFactory } from "../../MetricsDB/ContributorFactory";

export type ImportModel = {
    teamName: string;
    botUserNames: string[],
    formerEmployeeNames: string[],
    pullRequest: GitHubPullRequestModel,
    pullRequestActivities: GitHubPullRequestActivityModel[],
    files: GitHubFileModel[]
}

export class GitHubPullRequest extends PullRequest {
    public async init(model: ImportModel) {
        return await (await this.initializeBaseProperties(model))
            .initializeDates(model)
            .calculateCommitStats(model)
            .initializeParticipants(model);
    }

    private async initializeBaseProperties(model: ImportModel) {
        this.teamName = model.teamName;
        this.projectKey = model.pullRequest.base.repo.owner.login;
        this.repositoryName = model.pullRequest.base.repo.name;
        this.pullRequestNumber = model.pullRequest.number;
        this.viewURL = model.pullRequest.html_url;
        this.targetBranch = model.pullRequest.base.ref;
        this.reviewersCount = model.pullRequest.requested_reviewers.length;

        const authorLogin = model.pullRequest.user.login;
        this.author = await ContributorFactory.fetchContributor({
            teamName: model.teamName,
            login: authorLogin,
            isBotUser: model.botUserNames.includes(authorLogin),
            isFormerEmployee: model.formerEmployeeNames.includes(authorLogin)
        });

        return this;
    }

    private initializeDates(model: ImportModel) {
        this.openedDate = this.calculatePrOpenDate(model);
        this.mergedDate = new Date(model.pullRequest.merged_at);

        const commitTimestamps = model.pullRequestActivities.filter(a => a.event == "committed").map((c) => new Date(c.author!.date).getTime());
        this.initialCommitDate = new Date(Math.min(...commitTimestamps));
        this.lastCommitDate = new Date(Math.max(...commitTimestamps));

        return this;
    }

    private calculateCommitStats(model: ImportModel) {
        this.commentsCount = getHumanComments(model.pullRequestActivities, model.botUserNames).length;
        this.diffSize = model.files.reduce((acc, file) => acc + file.changes, 0);
        this.testsWereTouched = model.files.some(file => file.filename.toLowerCase().includes("test"));
        return this;
    }

    private async initializeParticipants(model: ImportModel) {
        const allParticipants = new Set<string>([
            ...model.pullRequest.requested_reviewers.map(r => r.login),
            ...model.pullRequest.assignees.map(p => p.login)
        ]);
        this.participants = [];
        for (const participantName of Array.from(allParticipants)) {
            this.participants.push(await new GitHubPullRequestParticipant().init(
                model.teamName,
                participantName,
                model.pullRequest,
                GitHubPullRequest.getActivitiesOf(model.pullRequestActivities, participantName),
                model.botUserNames,
                model.formerEmployeeNames
            ));
        }
        return this;
    }

    private calculatePrOpenDate(model: ImportModel): Date {
        const readyForReviewEvent = model.pullRequestActivities.filter(a => a.event == "ready_for_review");
        if (readyForReviewEvent.length > 0) {
            const earliestDate = Math.min(...readyForReviewEvent.map(a => new Date(a.created_at).getTime()));
            return new Date(earliestDate);
        }

        const reviewerAdditions = model.pullRequestActivities.filter(a => a.event == "review_requested");
        if (reviewerAdditions.length > 0) {
            const initialReviewers = reviewerAdditions.filter(a => a.created_at == model.pullRequest.created_at).map(r => r.requested_reviewer!.login).filter(s => !model.botUserNames.includes(s));
            // If all reviewers were added after PR was opened
            if (initialReviewers.length == 0) {
                const earliestAddingDate = Math.min(...reviewerAdditions.map(activity => new Date(activity.created_at).getTime()));
                return new Date(earliestAddingDate);
            }
        }
        return new Date(model.pullRequest.created_at);
    }

    private static getActivitiesOf(activities: GitHubPullRequestActivityModel[], userName: string) {
        return activities.filter(a => (a.actor || a.author || a.user).login === userName);
    }
}
