import {PullRequest} from "../../MetricsDB/entities/PullRequest";
import {GitHubPullRequestParticipant} from "./GitHubPullRequestParticipant";
import {ActorFactory} from "../../MetricsDB/ActorFactory";
import {ActivityTraits} from "./helpers/ActivityTraits";
import {ImportParams} from "./ImportParams";
import getActivitiesOf from "./helpers/getActivitiesOf";
import calculatePrSharedForReviewDate from "./helpers/calculatePrSharedForReviewDate";
import {GitHubUserModel} from "../GitHubAPI.contracts";
import {calculateRequestedReviewersCount} from "./helpers/calculateRequestedReviewersCount";
import {mapGithubUserAssociationToActorRole} from "./helpers/mapGithubUserAssociationToActorRole";
import {getCommentsTimestamps} from "./helpers/getCommentsTimestamps";
import {GitHubPullRequestActivity} from "./GitHubPullRequestActivity";


export class GitHubPullRequest extends PullRequest {
    public async init(model: ImportParams) {
        await this.initializeBaseProperties(model);

        await this.initializeDates(model)
            .initializeDiffStats(model)
            .initializeParticipants(model);

        await this.initializeActivities(model);

        return this.calculateAggregations();
    }

    private async initializeBaseProperties(model: ImportParams) {
        this.teamName = model.teamName;
        this.projectName = model.pullRequest.base.repo.owner.login;
        this.repositoryName = model.pullRequest.base.repo.name;
        this.pullRequestNumber = model.pullRequest.number;
        this.viewURL = model.pullRequest.html_url;
        this.targetBranch = model.pullRequest.base.ref;

        this.requestedReviewersCount = calculateRequestedReviewersCount(model);
        this.authorCommentsCount = getCommentsTimestamps(getActivitiesOf(model.activities, model.pullRequest.user.login)).length;

        this.authorRole = mapGithubUserAssociationToActorRole(model.pullRequest.author_association);
        this.createdDate = new Date(model.pullRequest.created_at);
        this.updatedDate = new Date(model.pullRequest.updated_at);


        const authorLogin = model.pullRequest.user.login;
        this.author = await ActorFactory.fetch({
            teamName: model.teamName,
            login: authorLogin,
            isBotUser: model.pullRequest.user.type === "Bot"
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
            .concat(model.activities.filter(ActivityTraits.isConsistentMergedEvent).map(c => c.actor))
            .concat(model.activities.filter(ActivityTraits.isCommentedEvent).map(c => c.actor))
            .concat(model.activities.filter(ActivityTraits.isLineCommentedEvent).flatMap(c => c.comments).filter(c => !!c.user).map(c => c.user!))
            .concat(model.activities.filter(ActivityTraits.isConsistentReviewedEvent).map(u => u.user!))
            .filter(p => !!p.login)
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
                    const actor = await ActorFactory.fetch({
                        teamName: model.teamName,
                        login: participant.login,
                        isBotUser: participant.type === "Bot"
                    });

                    return new GitHubPullRequestParticipant(
                        model.teamName,
                        model.pullRequest,
                        getActivitiesOf(model.activities, participant.login),
                        actor
                    );
                }));
        return this;
    }

    private async initializeActivities(model: ImportParams) {
        this.activities = [];

        const commentActivities = model.activities.filter(ActivityTraits.isCommentedEvent).map(comment => {
            return new GitHubPullRequestActivity(model.teamName, model.pullRequest, comment.event, new Date(comment.created_at), comment.actor.login, comment.body, comment.html_url);
        });
        this.activities.push(...commentActivities);

        const lineCommentActivities = model.activities.filter(ActivityTraits.isLineCommentedEvent).flatMap(a => a.comments).filter(c => !!c.user).map(lineComment => {
            return new GitHubPullRequestActivity(model.teamName, model.pullRequest, "commented", new Date(lineComment.created_at), lineComment.user!.login, lineComment.body, lineComment.html_url);
        });
        this.activities.push(...lineCommentActivities);

        const commitActivities = model.activities.filter(ActivityTraits.isCommitedEvent).map(commit => {
            return new GitHubPullRequestActivity(model.teamName, model.pullRequest, commit.event, new Date(commit.committer.date), commit.committer.name, commit.message, commit.html_url);
        });
        this.activities.push(...commitActivities);


        const reviewActivities = model.activities
            .filter(ActivityTraits.isConsistentReviewedEvent)
            .map(review => {
                return new GitHubPullRequestActivity(model.teamName, model.pullRequest, review.state == "commented" ? review.event : review.state, new Date(review.submitted_at), review.user!.login, review.body, review.html_url);
            });
        this.activities.push(...reviewActivities);

        const readyForReviewActivities = model.activities.filter(ActivityTraits.isReadyForReviewEvent).map(event => {
            return new GitHubPullRequestActivity(model.teamName, model.pullRequest, event.event, new Date(event.created_at), event.actor.login, null, null);
        });
        this.activities.push(...readyForReviewActivities);

        const mergeActivities = model.activities.filter(ActivityTraits.isConsistentMergedEvent).map(merge => {
            return new GitHubPullRequestActivity(model.teamName, model.pullRequest, merge.event, new Date(merge.created_at), merge.actor.login, null, null);
        });
        this.activities.push(...mergeActivities);

        return this;
    }
}
