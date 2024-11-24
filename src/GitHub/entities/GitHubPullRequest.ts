import { PullRequest } from "../../MetricsDB/entities/PullRequest";
import { GitHubPullRequestParticipant } from "./GitHubPullRequestParticipant";
import { ActorFactory } from "../../MetricsDB/ActorFactory";
import { ActivityTraits } from "./helpers/ActivityTraits";
import { ImportParams } from "./ImportParams";
import getActivitiesOf from "./helpers/getActivitiesOf";
import calculatePrSharedForReviewDate from "./helpers/calculatePrSharedForReviewDate";
import { GitHubUserModel } from "../GitHubAPI.contracts";
import { calculateReviewersCount } from "./helpers/calculateReviewersCount";
import { mapGithubUserAssociationToActorRole } from "./helpers/mapGithubUserAssociationToActorRole";
import { getCommentsTimestamps } from "./helpers/getCommentsTimestamps";


export class GitHubPullRequest extends PullRequest {
    public async init(model: ImportParams) {
        await this.initializeBaseProperties(model);

        await this.initializeDates(model)
            .initializeDiffStats(model)
            .initializeParticipants(model);

        return this.calculateAggregations();
    }

    private async initializeBaseProperties(model: ImportParams) {
        this.teamName = model.teamName;
        this.projectName = model.pullRequest.base.repo.owner.login;
        this.repositoryName = model.pullRequest.base.repo.name;
        this.pullRequestNumber = model.pullRequest.number;
        this.viewURL = model.pullRequest.html_url;
        this.targetBranch = model.pullRequest.base.ref;

        this.requestedReviewersCount = calculateReviewersCount(model);
        this.authorCommentsCount = getCommentsTimestamps(getActivitiesOf(model.activities, model.pullRequest.user.login)).length;

        this.authorRole = mapGithubUserAssociationToActorRole(model.pullRequest.author_association);
        this.createdDate = new Date(model.pullRequest.created_at);
        this.updatedDate = new Date(model.pullRequest.updated_at);


        const authorLogin = model.pullRequest.user.login;
        this.author = await ActorFactory.fetch({
            teamName: model.teamName,
            login: authorLogin,
            isBotUser: model.botUserNames.includes(authorLogin) || model.pullRequest.user.type === "Bot"
        });

        return this;
    }

    private initializeDates(model: ImportParams) {
        this.sharedForReviewDate = calculatePrSharedForReviewDate(model);
        this.mergedDate = new Date(model.pullRequest.merged_at);
        const commitTimestamps = model.activities.filter(ActivityTraits.isCommitedEvent).map((c) => new Date(c.author.date).getTime());
        if (commitTimestamps.length > 0) {
            this.initialCommitDate = new Date(Math.min(...commitTimestamps));
            this.lastCommitDate = new Date(Math.max(...commitTimestamps));
        }
        return this;
    }

    private initializeDiffStats(model: ImportParams) {
        this.diffRowsAdded = model.files.reduce((acc, file) => acc + file.additions, 0);
        this.diffRowsDeleted = model.files.reduce((acc, file) => acc + file.deletions, 0);

        this.testsWereTouched = model.files.some(file => file.filename.toLowerCase().includes("test"));
        return this;
    }

    private async initializeParticipants(model: ImportParams) {
        const allParticipants = model.pullRequest
            .requested_reviewers.map(r => r)
            .concat(model.pullRequest.assignees.map(p => p))
            .concat(model.activities.filter(ActivityTraits.isMergedEvent).map(c => c.actor))
            .concat(model.activities.filter(ActivityTraits.isCommentedEvent).map(c => c.actor))
            .concat(model.activities.filter(ActivityTraits.isLineCommentedEvent).flatMap(c => c.comments).map(c => c.user))
            .concat(model.activities.filter(ActivityTraits.isReviewedEvent).map(u => u.user).filter(u => !!u))
            .filter(p => !!p?.login)
            .filter(p => p.login !== model.pullRequest.user.login);

        const uniqueParticipants = Object.values(
            allParticipants.reduce((acc: Record<string, GitHubUserModel>, user) => {
                acc[user.login] = user;
                return acc;
            }, {})
        );

        this.participants = await Promise.all(
            Array.from(uniqueParticipants)
                .map(async participant => {
                    const participantUser = await ActorFactory.fetch({
                        teamName: model.teamName,
                        login: participant.login,
                        isBotUser: model.botUserNames.includes(participant.login) || participant.type === "Bot"
                    });

                    return new GitHubPullRequestParticipant(
                        model.teamName,
                        model.pullRequest,
                        getActivitiesOf(model.activities, participant.login),
                        participantUser
                    );
                }));
        return this;
    }
}
