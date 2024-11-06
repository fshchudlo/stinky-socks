import { PullRequestParticipant } from "../../MetricsDB/entities/PullRequestParticipant";
import { GitHubPullRequestActivityModel, GitHubPullRequestModel } from "../api/GitHubAPI.contracts";
import { ActivityTraits } from "./helpers/ActivityTraits";
import getNonBotCommentsTimestamps from "./helpers/getNonBotCommentsTimestamps";
import { Actor } from "../../MetricsDB/entities/Actor";

export class GitHubPullRequestParticipant extends PullRequestParticipant {
    constructor(teamName: string, pullRequestData: GitHubPullRequestModel, participantActivities: GitHubPullRequestActivityModel[], participantUser: Actor) {
        super();
        this.initializeBaseProperties(teamName, pullRequestData, participantUser)
            .setCommentStats(participantActivities)
            .setReviewStats(participantActivities)
            .setApprovalStats(participantActivities);
    }

    private initializeBaseProperties(teamName: string, pullRequestData: GitHubPullRequestModel, participantUser: Actor) {
        this.teamName = teamName;
        this.projectName = pullRequestData.base.repo.owner.login;
        this.repositoryName = pullRequestData.base.repo.name;
        this.pullRequestNumber = pullRequestData.number;
        this.participant = participantUser;
        this.participantIdForPrimaryKeyHack = this.participant.id;
        return this;
    }

    private setCommentStats(participantActivities: GitHubPullRequestActivityModel[]) {
        const commentTimestamps = getNonBotCommentsTimestamps(participantActivities);
        this.firstCommentDate = commentTimestamps.length ? new Date(Math.min(...commentTimestamps)) : null as any;
        this.lastCommentDate = commentTimestamps.length ? new Date(Math.max(...commentTimestamps)) : null as any;
        this.commentsCount = commentTimestamps.length;
        return this;
    }

    private setReviewStats(participantActivities: GitHubPullRequestActivityModel[]) {
        const reviews = participantActivities
            .filter(ActivityTraits.isReviewedEvent);

        const reviewTimestamps = reviews.map(a => new Date(a.submitted_at!).getTime());
        this.firstReviewDate = reviewTimestamps.length ? new Date(Math.min(...reviewTimestamps)) : null as any;
        this.lastReviewDate = reviewTimestamps.length ? new Date(Math.max(...reviewTimestamps)) : null as any;
        return this;
    }
    private setApprovalStats(participantActivities: GitHubPullRequestActivityModel[]) {
        const approvals = participantActivities
            .filter(ActivityTraits.isReviewedEvent)
            .filter(a => a.state === "approved");

        const approvalTimestamps = approvals.map(a => new Date(a.submitted_at!).getTime());
        this.firstApprovalDate = approvalTimestamps.length ? new Date(Math.min(...approvalTimestamps)) : null as any;
        this.lastApprovalDate = approvalTimestamps.length ? new Date(Math.max(...approvalTimestamps)) : null as any;
        return this;
    }

}
  