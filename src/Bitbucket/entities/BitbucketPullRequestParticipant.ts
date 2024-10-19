import { PullRequestParticipant } from "../../metrics-db/PullRequestParticipant";
import getHumanActivities from "./getHumanActivities";
import { BitbucketPullRequestActivityModel, BitbucketPullRequestModel } from "../api/BitbucketAPI";

export class BitbucketPullRequestParticipant extends PullRequestParticipant {
    constructor(participantName: string, pullRequestData: BitbucketPullRequestModel, participantActivities: BitbucketPullRequestActivityModel[], botUserSlugs: string[], formerEmployeeSlugs: string[]) {
        super();
        this.initializeBaseProperties(participantName, pullRequestData)
            .setUserStatus(botUserSlugs, formerEmployeeSlugs)
            .setCommentStats(participantActivities, botUserSlugs)
            .setApprovalStats(participantActivities, botUserSlugs);
    }

    private initializeBaseProperties(participantName: string, pullRequestData: BitbucketPullRequestModel): BitbucketPullRequestParticipant {
        this.projectKey = pullRequestData.toRef.repository.project.key;
        this.repositoryName = pullRequestData.toRef.repository.slug;
        this.pullRequestNumber = pullRequestData.id;
        this.participantName = participantName;
        return this;
    }

    private setUserStatus(botUserSlugs: string[], formerEmployeeSlugs: string[]): BitbucketPullRequestParticipant {
        this.isBotUser = botUserSlugs.includes(this.participantName);
        this.isFormerEmployee = formerEmployeeSlugs.includes(this.participantName);
        return this;
    }

    private setCommentStats(participantActivities: BitbucketPullRequestActivityModel[], botUserSlugs: string[]): BitbucketPullRequestParticipant {
        const comments = getHumanActivities(participantActivities, botUserSlugs, "COMMENTED");

        const commentTimestamps = comments.map(c => c.createdDate as number);
        this.firstCommentDate = commentTimestamps.length ? new Date(Math.min(...commentTimestamps)) : null as any;
        this.lastCommentDate = commentTimestamps.length ? new Date(Math.max(...commentTimestamps)) : null as any;
        this.commentsCount = comments.length;
        return this;
    }

    private setApprovalStats(participantActivities: BitbucketPullRequestActivityModel[], botUserSlugs: string[]): BitbucketPullRequestParticipant {
        const approvals = getHumanActivities(participantActivities, botUserSlugs, "APPROVED");

        const approvalTimestamps = approvals.map(a => a.createdDate);
        this.firstApprovalDate = approvalTimestamps.length ? new Date(Math.min(...approvalTimestamps)) : null as any;
        this.lastApprovalDate = approvalTimestamps.length ? new Date(Math.max(...approvalTimestamps)) : null as any;
        return this;
    }

}
  