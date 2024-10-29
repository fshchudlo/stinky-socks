import { PullRequest } from "../../MetricsDB/entities/PullRequest";
import { GitHubPullRequestParticipant } from "./GitHubPullRequestParticipant";
import { UserFactory } from "../../MetricsDB/UserFactory";
import { ActivityTraits } from "./helpers/ActivityTraits";
import { ImportParams } from "./ImportParams";
import getCommentsTimestamps from "./helpers/getCommentsTimestamps";
import getActivitiesOf from "./helpers/getActivitiesOf";
import calculatePrSharedForReviewDate from "./helpers/calculatePrSharedForReviewDate";

export class GitHubPullRequest extends PullRequest {
    public async init(model: ImportParams) {
        await this.initializeBaseProperties(model);

        await this.initializeDates(model)
            .calculateCommitStats(model)
            .initializeParticipants(model);

        return this.validateDataIntegrity().calculateTimings();
    }

    private async initializeBaseProperties(model: ImportParams) {
        this.teamName = model.teamName;
        this.projectName = model.pullRequest.base.repo.owner.login;
        this.repositoryName = model.pullRequest.base.repo.name;
        this.pullRequestNumber = model.pullRequest.number;
        this.viewURL = model.pullRequest.html_url;
        this.targetBranch = model.pullRequest.base.ref;
        this.requestedReviewersCount = model.pullRequest.requested_reviewers.length;
        this.authorRole = model.pullRequest.author_association;
        this.createdDate = new Date(model.pullRequest.created_at);
        this.updatedDate = new Date(model.pullRequest.updated_at);


        const authorLogin = model.pullRequest.user.login;
        this.author = await UserFactory.fetch({
            teamName: model.teamName,
            login: authorLogin,
            isBotUser: model.botUserNames.includes(authorLogin),
            isFormerEmployee: model.formerEmployeeNames.includes(authorLogin)
        });

        return this;
    }

    private initializeDates(model: ImportParams) {
        this.sharedForReviewDate = calculatePrSharedForReviewDate(model);
        this.mergedDate = new Date(model.pullRequest.merged_at);

        const commitTimestamps = model.pullRequestActivities.filter(ActivityTraits.isCommitedEvent).map((c) => new Date(c.author.date).getTime());
        if (commitTimestamps.length > 0) {
            this.initialCommitDate = new Date(Math.min(...commitTimestamps));
            this.lastCommitDate = new Date(Math.max(...commitTimestamps));
        }
        return this;
    }

    private calculateCommitStats(model: ImportParams) {
        this.totalCommentsCount = getCommentsTimestamps(model.pullRequestActivities, model.botUserNames).length;
        this.diffSize = model.files.reduce((acc, file) => acc + file.changes, 0);
        this.testsWereTouched = model.files.some(file => file.filename.toLowerCase().includes("test"));
        return this;
    }

    private async initializeParticipants(model: ImportParams) {
        const allParticipants = new Set<string | null>([
            ...model.pullRequest.requested_reviewers.map(r => r.login),
            ...model.pullRequest.assignees.map(p => p.login),
            ...model.pullRequestActivities.filter(ActivityTraits.isMergedEvent).map(c => c.actor.login),
            ...model.pullRequestActivities.filter(ActivityTraits.isCommentedEvent).map(c => c.actor.login),
            ...model.pullRequestActivities.filter(ActivityTraits.isLineCommentedEvent).flatMap(c => c.comments).map(c => c.user?.login),
            ...model.pullRequestActivities.filter(ActivityTraits.isReviewedEvent).map(c => c.user?.login || null)
        ]);

        this.participants = await Promise.all(
            Array.from(allParticipants)
                .filter((participantLogin): participantLogin is string => !!participantLogin)
                .filter(participantLogin => participantLogin !== model.pullRequest.user.login)
                .map(async participantLogin => {

                    const participantUser = await UserFactory.fetch({
                        teamName: model.teamName,
                        login: participantLogin,
                        isBotUser: model.botUserNames.includes(participantLogin),
                        isFormerEmployee: model.formerEmployeeNames.includes(participantLogin)
                    });

                    return new GitHubPullRequestParticipant(
                        model.teamName,
                        model.pullRequest,
                        getActivitiesOf(model.pullRequestActivities, participantLogin),
                        participantUser
                    );
                }));
        return this;
    }
}
