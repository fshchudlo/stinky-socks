import { PullRequestParticipant } from "../../metrics-db/PullRequestParticipant";
import getHumanComments from "./getHumanComments";
import { GitHubPullRequestActivityModel, GitHubPullRequestModel } from "../api/GitHubAPI";

export class GitHubPullRequestParticipant extends PullRequestParticipant {
    constructor(participantName: string, pullRequestData: GitHubPullRequestModel, participantActivities: GitHubPullRequestActivityModel[], botUserNames: string[], formerEmployeeNames: string[]) {
        super();
        this.initializeBaseProperties(participantName, pullRequestData)
            .setUserStatus(botUserNames, formerEmployeeNames)
            .setCommentStats(participantActivities, botUserNames)
            .setApprovalStats(participantActivities, botUserNames);
    }

    private initializeBaseProperties(participantName: string, pullRequestData: GitHubPullRequestModel): GitHubPullRequestParticipant {
        this.projectKey = pullRequestData.base.repo.owner.login;
        this.repositoryName = pullRequestData.base.repo.name;
        this.pullRequestNumber = pullRequestData.number;
        this.participantName = participantName;
        return this;
    }

    private setUserStatus(botUserNames: string[], formerEmployeeNames: string[]): GitHubPullRequestParticipant {
        this.isBotUser = botUserNames.includes(this.participantName);
        this.isFormerEmployee = formerEmployeeNames.includes(this.participantName);
        return this;
    }

    private setCommentStats(participantActivities: GitHubPullRequestActivityModel[], botUserNames: string[]): GitHubPullRequestParticipant {
        const comments = getHumanComments(participantActivities, botUserNames);

        const commentTimestamps = comments.map(c => new Date(c.submitted_at!).getTime());
        this.firstCommentDate = commentTimestamps.length ? new Date(Math.min(...commentTimestamps)) : null as any;
        this.lastCommentDate = commentTimestamps.length ? new Date(Math.max(...commentTimestamps)) : null as any;
        this.commentsCount = comments.length;
        return this;
    }

    private setApprovalStats(participantActivities: GitHubPullRequestActivityModel[], botUserNames: string[]): GitHubPullRequestParticipant {
        const approvals = participantActivities
            .filter(a => a.event === "reviewed" && a.state === "approved")
            .filter(a => !botUserNames.includes(a.user.login));

        const approvalTimestamps = approvals.map(a => new Date(a.submitted_at!).getTime());
        this.firstApprovalDate = approvalTimestamps.length ? new Date(Math.min(...approvalTimestamps)) : null as any;
        this.lastApprovalDate = approvalTimestamps.length ? new Date(Math.max(...approvalTimestamps)) : null as any;
        return this;
    }

}
  