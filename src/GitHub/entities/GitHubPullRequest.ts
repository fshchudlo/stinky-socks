import { PullRequest } from "../../MetricsDB/PullRequest";
import getHumanComments from "./getHumanComments";
import { GitHubPullRequestParticipant } from "./GitHubPullRequestParticipant";
import {
    ActivityTraits,
    GitHubFileModel,
    GitHubPullRequestActivityModel,
    GitHubPullRequestModel
} from "../api/contracts";
import { ContributorFactory } from "../../MetricsDB/ContributorFactory";
import getHumanLineComments from "./getHumanLineComments";

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
        this.projectName = model.pullRequest.base.repo.owner.login;
        this.repositoryName = model.pullRequest.base.repo.name;
        this.pullRequestNumber = model.pullRequest.number;
        this.viewURL = model.pullRequest.html_url;
        this.targetBranch = model.pullRequest.base.ref;
        this.reviewersCount = model.pullRequest.requested_reviewers.length;
        this.authorRole = model.pullRequest.author_association;
        this.createdDate = new Date(model.pullRequest.created_at);
        this.updatedDate = new Date(model.pullRequest.updated_at);


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
        this.sharedForReviewDate = this.calculatePrSharedForReviewDate(model);
        this.mergedDate = new Date(model.pullRequest.merged_at);

        const commitTimestamps = model.pullRequestActivities.filter(ActivityTraits.isCommitedEvent).map((c) => new Date(c.author!.date).getTime());
        this.initialCommitDate = new Date(Math.min(...commitTimestamps));
        this.lastCommitDate = new Date(Math.max(...commitTimestamps));

        return this;
    }

    private calculateCommitStats(model: ImportModel) {
        this.commentsCount = getHumanComments(model.pullRequestActivities, model.botUserNames).length + getHumanLineComments(model.pullRequestActivities, model.botUserNames).length;
        this.diffSize = model.files.reduce((acc, file) => acc + file.changes, 0);
        this.testsWereTouched = model.files.some(file => file.filename.toLowerCase().includes("test"));
        return this;
    }

    private async initializeParticipants(model: ImportModel) {
        const allParticipants = new Set<string>([
            ...model.pullRequest.requested_reviewers.map(r => r.login),
            ...model.pullRequest.assignees.map(p => p.login)
        ]);
        this.participants = await Promise.all(Array.from(allParticipants).map(participantName =>
            new GitHubPullRequestParticipant().init(
                model.teamName,
                participantName,
                model.pullRequest,
                GitHubPullRequest.getActivitiesOf(model.pullRequestActivities, participantName),
                model.botUserNames,
                model.formerEmployeeNames
            )));
        return this;
    }

    private calculatePrSharedForReviewDate(model: ImportModel): Date {
        const readyForReviewEvent = model.pullRequestActivities.filter(ActivityTraits.isReadyForReviewEvent);
        if (readyForReviewEvent.length > 0) {
            const earliestDate = Math.min(...readyForReviewEvent.map(a => new Date(a.created_at).getTime()));
            return new Date(earliestDate);
        }

        const nonBotReviewerAdditions = model.pullRequestActivities
            .filter(ActivityTraits.isReviewRequestedEvent)
            .filter(a => !model.botUserNames.includes(a.requested_reviewer?.login || a.requested_team?.name));

        if (nonBotReviewerAdditions.length > 0) {
            const reviewersAddedAtPRCreation = nonBotReviewerAdditions
                .filter(a => new Date(a.created_at).getTime() == new Date(model.pullRequest.created_at).getTime());

            if (reviewersAddedAtPRCreation.length == 0) {
                // All reviewers were added after PR was opened
                const earliestAdditionDate = Math.min(...nonBotReviewerAdditions.map(activity => new Date(activity.created_at).getTime()));
                return new Date(earliestAdditionDate);
            }
        }
        return new Date(model.pullRequest.created_at);
    }

    private static getActivitiesOf(activities: GitHubPullRequestActivityModel[], userName: string) {
        return activities.filter(a => {
            if (ActivityTraits.isLineCommentedEvent(a)) {
                return a.comments.map(c => c.user.login).includes(userName);
            }

            const typedA = a as any;
            return (typedA.actor?.login || typedA.author?.login || typedA.user?.login) === userName;
        });
    }
}
