import { PullRequest } from "../../MetricsDB/entities/PullRequest";
import { ImportParams } from "./ImportParams";
import { ActorRole } from "../../MetricsDB/entities/ActorRole";
import { ActorFactory } from "../../MetricsDB/ActorFactory";
import { getCommentsTimestamps } from "./helpers/getCommentsTimestamps";
import getActivitiesOf from "./helpers/getActivitiesOf";
import { GitlabPullRequestParticipant } from "./GitlabPullRequestParticipant";
import { GitlabUserModel } from "../GitlabAPI.contracts";
import { ActivityTraits } from "./helpers/ActivityTraits";
import { GitlabPullRequestActivity } from "./GitlabPullRequestActivity";
import { calculateRequestedReviewersCount } from "./helpers/calculateRequestedReviewersCount";


export class GitlabPullRequest extends PullRequest {
    public async init(model: ImportParams) {
        await this.initializeBaseProperties(model);

        await this
            //.initializeDates(model)
            //.initializeDiffStats(model)
            .initializeParticipants(model);

        await this.initializeActivities(model);

        return this.calculateAggregations();
    }

    private async initializeBaseProperties(model: ImportParams) {
        this.teamName = model.teamName;
        this.projectName = model.repository.namespace.name;
        this.repositoryName = model.repository.name;
        this.pullRequestNumber = model.pullRequest.id;
        this.viewURL = model.pullRequest.web_url;
        this.targetBranch = model.pullRequest.target_branch;

        this.requestedReviewersCount = calculateRequestedReviewersCount(model);
        this.authorCommentsCount = getCommentsTimestamps(getActivitiesOf(model.activities, model.pullRequest.author.username)).length;

        this.authorRole = ActorRole.MEMBER;
        this.createdDate = new Date(model.pullRequest.created_at);
        this.updatedDate = new Date(model.pullRequest.updated_at);

        const authorLogin = model.pullRequest.author.username;
        this.author = await ActorFactory.fetch({
            teamName: model.teamName,
            login: authorLogin,
            isBotUser: model.pullRequest.author.bot
        });

        return this;
    }

    // private initializeDates(model: ImportParams) {
    //     this.sharedForReviewDate = calculatePrSharedForReviewDate(model);
    //     this.mergedDate = new Date(model.pullRequest.merged_at);
    //     const commitTimestamps = model.activities.filter(ActivityTraits.isCommitedEvent).map((c) => new Date(c.author.date).getTime());
    //     if (commitTimestamps.length > 0) {
    //         this.initialCommitDate = new Date(Math.min(...commitTimestamps));
    //         this.lastCommitDate = new Date(Math.max(...commitTimestamps));
    //     }
    //     return this;
    // }

    // private initializeDiffStats(model: ImportParams) {
    //     this.diffRowsAdded = model.files.reduce((acc, file) => acc + file.additions, 0);
    //     this.diffRowsDeleted = model.files.reduce((acc, file) => acc + file.deletions, 0);
    //
    //     this.testsWereTouched = model.files.some(file => file.filename.toLowerCase().includes("test"));
    //     return this;
    // }
    //
    private async initializeParticipants(model: ImportParams) {
        const allParticipants = model.pullRequest
            .reviewers.map(r => r)
            .concat([model.pullRequest.merged_by])
            .concat(model.pullRequest.assignees.map(p => p))
            .concat(model.activities.filter(ActivityTraits.isCommentedEvent).map(c => c.author))
            .concat(model.activities.filter(ActivityTraits.isReviewedEvent).map(u => u.author))
            .filter(p => p.username !== model.pullRequest.author.username);

        const uniqueParticipants = Object.values(
            allParticipants.reduce((acc: Record<string, GitlabUserModel>, user) => {
                acc[user.username] = user;
                return acc;
            }, {})
        );

        this.participants = await Promise.all(
            Array.from(uniqueParticipants)
                .map(async participant => {
                    const actor = await ActorFactory.fetch({
                        teamName: model.teamName,
                        login: participant.username,
                        isBotUser: participant.bot
                    });

                    return new GitlabPullRequestParticipant(
                        model.teamName,
                        model.repository,
                        model.pullRequest,
                        getActivitiesOf(model.activities, participant.username),
                        actor
                    );
                }));
        return this;
    }


    private async initializeActivities(model: ImportParams) {
        this.activities = [];

        const commentActivities = model.activities.filter(ActivityTraits.isCommentedEvent).map(comment => {
            return new GitlabPullRequestActivity(
                model.teamName,
                model.repository,
                model.pullRequest,
                "commented",
                new Date(comment.created_at),
                comment.author.username,
                comment.body,
                null
            );
        });
        this.activities.push(...commentActivities);


        const approvedActivities = model.activities
            .filter(ActivityTraits.isApprovedEvent)
            .map(review => {
                return new GitlabPullRequestActivity(model.teamName, model.repository, model.pullRequest, "approved", new Date(review.created_at), review.author.username, review.body, null);
            });
        this.activities.push(...approvedActivities);

        const unapprovedActivities = model.activities
            .filter(ActivityTraits.isUnapprovedEvent)
            .map(review => {
                return new GitlabPullRequestActivity(model.teamName, model.repository, model.pullRequest, "dismissed", new Date(review.created_at), review.author.username, review.body, null);
            });
        this.activities.push(...unapprovedActivities);

        const changesRequestedActivities = model.activities
            .filter(ActivityTraits.isRequestedChangesEvent)
            .map(review => {
                return new GitlabPullRequestActivity(model.teamName, model.repository, model.pullRequest, "changes_requested", new Date(review.created_at), review.author.username, review.body, null);
            });
        this.activities.push(...changesRequestedActivities);

        // const commitActivities = model.activities.filter(ActivityTraits.isCommitedEvent).map(commit => {
        //     return new GitlabPullRequestActivity(model.repository, model.pullRequest, commit.event, new Date(commit.committer.date), commit.committer.name, commit.message, commit.html_url);
        // });
        // this.activities.push(...commitActivities);

        // const readyForReviewActivities = model.activities.filter(ActivityTraits.isReadyForReviewEvent).map(event => {
        //     return new GitlabPullRequestActivity(model.repository, model.pullRequest, event.event, new Date(event.created_at), event.actor.login, null, null);
        // });
        // this.activities.push(...readyForReviewActivities);
        //
        // const mergeActivities = model.activities.filter(ActivityTraits.isConsistentMergedEvent).map(merge => {
        //     return new GitlabPullRequestActivity(model.repository, model.pullRequest, merge.event, new Date(merge.created_at), merge.actor.login, null, null);
        // });
        // this.activities.push(...mergeActivities);

        return this;
    }
}
