import { PullRequestParticipant } from "../../MetricsDB/PullRequestParticipant";
import getHumanComments from "./getHumanComments";
import { ActivityTraits, GitHubPullRequestActivityModel, GitHubPullRequestModel } from "../api/contracts";
import { ContributorFactory } from "../../MetricsDB/ContributorFactory";
import getHumanLineComments from "./getHumanLineComments";

export class GitHubPullRequestParticipant extends PullRequestParticipant {
    async init(teamName: string, participantName: string, pullRequestData: GitHubPullRequestModel, participantActivities: GitHubPullRequestActivityModel[], botUserNames: string[], formerEmployeeNames: string[]) {
        return (await this.initializeBaseProperties(teamName, participantName, pullRequestData, botUserNames, formerEmployeeNames))
            .setCommentStats(participantActivities, botUserNames)
            .setApprovalStats(participantActivities, botUserNames);
    }

    private async initializeBaseProperties(teamName: string, participantName: string, pullRequestData: GitHubPullRequestModel, botUserNames: string[], formerEmployeeNames: string[]) {
        this.teamName = teamName;
        this.projectName = pullRequestData.base.repo.owner.login;
        this.repositoryName = pullRequestData.base.repo.name;
        this.pullRequestNumber = pullRequestData.number;
        this.participant = await ContributorFactory.fetchContributor({
            teamName: teamName,
            login: participantName,
            isBotUser: botUserNames.includes(participantName),
            isFormerEmployee: formerEmployeeNames.includes(participantName)
        });
        this.participantIdForPrimaryKeyHack = this.participant.id;
        return this;
    }

    private setCommentStats(participantActivities: GitHubPullRequestActivityModel[], botUserNames: string[]) {
        const comments = getHumanComments(participantActivities, botUserNames);
        const lineComments = getHumanLineComments(participantActivities, botUserNames);

        const commentTimestamps = comments.map(c => new Date(c.created_at!).getTime()).concat(lineComments.map(c => new Date(c.created_at!).getTime()));
        this.firstCommentDate = commentTimestamps.length ? new Date(Math.min(...commentTimestamps)) : null as any;
        this.lastCommentDate = commentTimestamps.length ? new Date(Math.max(...commentTimestamps)) : null as any;
        this.commentsCount = comments.length;
        return this;
    }

    private setApprovalStats(participantActivities: GitHubPullRequestActivityModel[], botUserNames: string[]) {
        const approvals = participantActivities
            .filter(ActivityTraits.isReviewedEvent)
            .filter(a => a.state === "approved")
            .filter(a => !botUserNames.includes(a.user.login));

        const approvalTimestamps = approvals.map(a => new Date(a.submitted_at!).getTime());
        this.firstApprovalDate = approvalTimestamps.length ? new Date(Math.min(...approvalTimestamps)) : null as any;
        this.lastApprovalDate = approvalTimestamps.length ? new Date(Math.max(...approvalTimestamps)) : null as any;
        return this;
    }

}
  