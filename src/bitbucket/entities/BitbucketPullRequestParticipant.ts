import { PullRequestParticipant } from "../../metrics-db/PullRequestParticipant";
import { Utils } from "./Utils";

export class BitbucketPullRequestParticipant extends PullRequestParticipant {
    constructor(participantName: string, pullRequestData: any, participantActivities: any[], botUsers: string[], formerEmployees: string[]) {
        super();
        this.initializeBaseProperties(participantName, pullRequestData)
            .setUserStatus(botUsers, formerEmployees)
            .setCommentStats(participantActivities, botUsers)
            .setApprovalStats(participantActivities, botUsers);
    }
    private initializeBaseProperties(participantName: string, pullRequestData: any): BitbucketPullRequestParticipant {
        this.projectKey = pullRequestData.toRef.repository.project.key;
        this.repositoryName = pullRequestData.toRef.repository.slug;
        this.pullRequestNumber = pullRequestData.id;
        this.participantName = participantName;
        return this;
    }

    private setUserStatus(botUsers: string[], formerEmployees: string[]): BitbucketPullRequestParticipant {
        this.isBotUser = botUsers.includes(this.participantName);
        this.isFormerEmployee = formerEmployees.includes(this.participantName);
        return this;
    }

    private setCommentStats(participantActivities: any[], botUsers: string[]): BitbucketPullRequestParticipant {
        const comments = Utils.getHumanActivities(participantActivities, botUsers, "COMMENTED");

        const commentTimestamps = comments.map((c: any) => c.createdDate as number);
        this.firstCommentDate = commentTimestamps.length ? new Date(Math.min(...commentTimestamps)) : null as any;
        this.lastCommentDate = commentTimestamps.length ? new Date(Math.max(...commentTimestamps)) : null as any;
        this.commentsCount = comments.length;
        return this;
    }

    private setApprovalStats(participantActivities: any[], botUsers: string[]): BitbucketPullRequestParticipant {
        const approvals = Utils.getHumanActivities(participantActivities, botUsers, "APPROVED");

        const approvalTimestamps = approvals.map((a: any) => a.createdDate);
        this.firstApprovalDate = approvalTimestamps.length ? new Date(Math.min(...approvalTimestamps)) : null as any;
        this.lastApprovalDate = approvalTimestamps.length ? new Date(Math.max(...approvalTimestamps)) : null as any;
        return this;
    }

}
  