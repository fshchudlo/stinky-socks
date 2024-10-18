import { PullRequestParticipant } from "../../metrics-db/PullRequestParticipant";
import { Utils } from "./Utils";

export class GithubPullRequestParticipant extends PullRequestParticipant {
    constructor(participantName: string, pullRequestData: any, participantActivities: any[], botUserSlugs: string[], formerEmployeeSlugs: string[]) {
        super();
        this.initializeBaseProperties(participantName, pullRequestData)
            .setUserStatus(botUserSlugs, formerEmployeeSlugs)
            .setCommentStats(participantActivities, botUserSlugs)
            .setApprovalStats(participantActivities, botUserSlugs);
    }
    private initializeBaseProperties(participantName: string, pullRequestData: any): GithubPullRequestParticipant {
        this.projectKey = pullRequestData.base.repo.owner.login;
        this.repositoryName = pullRequestData.base.repo.name;
        this.pullRequestNumber = pullRequestData.number;
        this.participantName = participantName;
        return this;
    }

    private setUserStatus(botUserSlugs: string[], formerEmployeeSlugs: string[]): GithubPullRequestParticipant {
        this.isBotUser = botUserSlugs.includes(this.participantName);
        this.isFormerEmployee = formerEmployeeSlugs.includes(this.participantName);
        return this;
    }

    private setCommentStats(participantActivities: any[], botUserSlugs: string[]): GithubPullRequestParticipant {
        const comments = Utils.getHumanComments(participantActivities, botUserSlugs);

        const commentTimestamps = comments.map((c: any) => c.createdDate as number);
        this.firstCommentDate = commentTimestamps.length ? new Date(Math.min(...commentTimestamps)) : null as any;
        this.lastCommentDate = commentTimestamps.length ? new Date(Math.max(...commentTimestamps)) : null as any;
        this.commentsCount = comments.length;
        return this;
    }

    private setApprovalStats(participantActivities: any[], botUserSlugs: string[]): GithubPullRequestParticipant {
        const approvals = Utils.getHumanActivities(participantActivities, botUserSlugs, "APPROVED");

        const approvalTimestamps = approvals.map((a: any) => a.createdDate);
        this.firstApprovalDate = approvalTimestamps.length ? new Date(Math.min(...approvalTimestamps)) : null as any;
        this.lastApprovalDate = approvalTimestamps.length ? new Date(Math.max(...approvalTimestamps)) : null as any;
        return this;
    }

}
  