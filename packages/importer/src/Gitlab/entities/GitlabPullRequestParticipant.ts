import { PullRequestParticipant } from "../../MetricsDB/entities/PullRequestParticipant";
import { Actor } from "../../MetricsDB/entities/Actor";
import { GitlabProjectModel, GitlabPullRequestActivityModel, GitlabPullRequestModel } from "../GitlabAPI.contracts";
import { getCommentsTimestamps } from "./helpers/getCommentsTimestamps";
import { ActivityTraits } from "./helpers/ActivityTraits";

export class GitlabPullRequestParticipant extends PullRequestParticipant {
    constructor(repository: GitlabProjectModel, pullRequestData: GitlabPullRequestModel, participantActivities: GitlabPullRequestActivityModel[], participantUser: Actor) {
        super();
        this.initializeBaseProperties(repository, pullRequestData, participantUser)
            .setCommentStats(participantActivities)
            .setReviewStats(participantActivities)
            .setApprovalStats(participantActivities);
    }

    private initializeBaseProperties(repository: GitlabProjectModel, pullRequestData: GitlabPullRequestModel, participantUser: Actor) {
        this.teamName = repository.namespace.name;
        this.projectName = repository.namespace.name;
        this.repositoryName = repository.name;
        this.pullRequestNumber = pullRequestData.id;
        this.participant = participantUser;
        this.participantIdForPrimaryKeyHack = this.participant.id;
        return this;
    }

    private setCommentStats(participantActivities: GitlabPullRequestActivityModel[]) {
        const commentTimestamps = getCommentsTimestamps(participantActivities);
        this.firstCommentDate = commentTimestamps.length ? new Date(Math.min(...commentTimestamps)) : null as any;
        this.lastCommentDate = commentTimestamps.length ? new Date(Math.max(...commentTimestamps)) : null as any;
        this.commentsCount = commentTimestamps.length;
        return this;
    }

    private setReviewStats(participantActivities: GitlabPullRequestActivityModel[]) {
        const reviews = participantActivities
            .filter(ActivityTraits.isReviewedEvent);

        const reviewTimestamps = reviews.map(a => new Date(a.created_at).getTime());
        this.firstReviewDate = reviewTimestamps.length ? new Date(Math.min(...reviewTimestamps)) : null as any;
        this.lastReviewDate = reviewTimestamps.length ? new Date(Math.max(...reviewTimestamps)) : null as any;
        return this;
    }

    private setApprovalStats(participantActivities: GitlabPullRequestActivityModel[]) {
        const approvals = participantActivities
            .filter(ActivityTraits.isApprovedEvent);

        const approvalTimestamps = approvals.map(a => new Date(a.created_at!).getTime());
        this.firstApprovalDate = approvalTimestamps.length ? new Date(Math.min(...approvalTimestamps)) : null as any;
        this.lastApprovalDate = approvalTimestamps.length ? new Date(Math.max(...approvalTimestamps)) : null as any;
        return this;
    }
}

