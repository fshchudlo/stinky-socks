import { PullRequestParticipant } from "../../metrics-db/PullRequestParticipant";
import getHumanComments from "./getHumanComments";

export class GithubPullRequestParticipant extends PullRequestParticipant {
    constructor(participantName: string, pullRequestData: any, participantActivities: any[], botUserNames: string[], formerEmployeeNames: string[]) {
        super();
        this.initializeBaseProperties(participantName, pullRequestData)
            .setUserStatus(botUserNames, formerEmployeeNames)
            .setCommentStats(participantActivities, botUserNames)
            .setApprovalStats(participantActivities, botUserNames);
    }

    private initializeBaseProperties(participantName: string, pullRequestData: any): GithubPullRequestParticipant {
        this.projectKey = pullRequestData.base.repo.owner.login;
        this.repositoryName = pullRequestData.base.repo.name;
        this.pullRequestNumber = pullRequestData.number;
        this.participantName = participantName;
        return this;
    }

    private setUserStatus(botUserNames: string[], formerEmployeeNames: string[]): GithubPullRequestParticipant {
        this.isBotUser = botUserNames.includes(this.participantName);
        this.isFormerEmployee = formerEmployeeNames.includes(this.participantName);
        return this;
    }

    private setCommentStats(participantActivities: any[], botUserNames: string[]): GithubPullRequestParticipant {
        const comments = getHumanComments(participantActivities, botUserNames);

        const commentTimestamps = comments.map((c: any) => new Date(c.submitted_at).getTime());
        this.firstCommentDate = commentTimestamps.length ? new Date(Math.min(...commentTimestamps)) : null as any;
        this.lastCommentDate = commentTimestamps.length ? new Date(Math.max(...commentTimestamps)) : null as any;
        this.commentsCount = comments.length;
        return this;
    }

    private setApprovalStats(participantActivities: any[], botUserNames: string[]): GithubPullRequestParticipant {
        const approvals = participantActivities
            .filter(a => a.event === "reviewed" && a.state === "approved")
            .filter(a => !botUserNames.includes(a.user.login));

        const approvalTimestamps = approvals.map((a: any) => new Date(a.submitted_at).getTime());
        this.firstApprovalDate = approvalTimestamps.length ? new Date(Math.min(...approvalTimestamps)) : null as any;
        this.lastApprovalDate = approvalTimestamps.length ? new Date(Math.max(...approvalTimestamps)) : null as any;
        return this;
    }

}
  