import { PullRequestParticipant } from "../../MetricsDB/entities/PullRequestParticipant";
import { BitbucketPullRequestActivityModel, BitbucketPullRequestModel } from "../api/BitbucketAPI.contracts";
import { Actor } from "../../MetricsDB/entities/Actor";

export class BitbucketPullRequestParticipant extends PullRequestParticipant {
    constructor(teamName: string, pullRequestData: BitbucketPullRequestModel, participantActivities: BitbucketPullRequestActivityModel[], participantUser: Actor) {
        super();
        this.initializeBaseProperties(teamName, pullRequestData, participantUser)
            .setCommentStats(participantActivities)
            .setReviewStats(participantActivities)
            .setApprovalStats(participantActivities);
    }

    private initializeBaseProperties(teamName: string, pullRequestData: BitbucketPullRequestModel, participantUser: Actor) {
        this.teamName = teamName;
        this.projectName = pullRequestData.toRef.repository.project.key;
        this.repositoryName = pullRequestData.toRef.repository.slug;
        this.pullRequestNumber = pullRequestData.id;
        this.participant = participantUser;
        return this;
    }

    private setCommentStats(participantActivities: BitbucketPullRequestActivityModel[]) {
        const comments = participantActivities
            .filter(a => a.action === "COMMENTED");

        const commentTimestamps = comments.map(c => c.createdDate as number);
        this.firstCommentDate = commentTimestamps.length ? new Date(Math.min(...commentTimestamps)) : null as any;
        this.lastCommentDate = commentTimestamps.length ? new Date(Math.max(...commentTimestamps)) : null as any;
        this.commentsCount = comments.length;
        return this;
    }

    private setApprovalStats(participantActivities: BitbucketPullRequestActivityModel[]) {
        const approvals = participantActivities
            .filter(a => a.action === "APPROVED");

        const approvalTimestamps = approvals.map(a => a.createdDate);
        this.firstApprovalDate = approvalTimestamps.length ? new Date(Math.min(...approvalTimestamps)) : null as any;
        this.lastApprovalDate = approvalTimestamps.length ? new Date(Math.max(...approvalTimestamps)) : null as any;
        return this;
    }

    private setReviewStats(participantActivities: BitbucketPullRequestActivityModel[]) {
        const reviews = participantActivities
            .filter(a => a.action === "REVIEWED");

        const reviewsTimestamps = reviews.map(a => a.createdDate);
        this.firstReviewDate = reviewsTimestamps.length ? new Date(Math.min(...reviewsTimestamps)) : null as any;
        this.lastReviewDate = reviewsTimestamps.length ? new Date(Math.max(...reviewsTimestamps)) : null as any;
        return this;
    }

}
  