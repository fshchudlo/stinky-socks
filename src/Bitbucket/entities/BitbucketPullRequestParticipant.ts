import { PullRequestParticipant } from "../../MetricsDB/PullRequestParticipant";
import getHumanActivities from "./getHumanActivities";
import { BitbucketPullRequestActivityModel, BitbucketPullRequestModel } from "../api/BitbucketAPI";
import { ContributorFactory } from "../../MetricsDB/ContributorFactory";

export class BitbucketPullRequestParticipant extends PullRequestParticipant {
    async init(teamName: string, participantName: string, pullRequestData: BitbucketPullRequestModel, participantActivities: BitbucketPullRequestActivityModel[], botUserSlugs: string[], formerEmployeeSlugs: string[]) {
        return (await this.initializeBaseProperties(teamName, participantName, pullRequestData, botUserSlugs, formerEmployeeSlugs))
            .setCommentStats(participantActivities, botUserSlugs)
            .setApprovalStats(participantActivities, botUserSlugs);
    }

    private async initializeBaseProperties(teamName: string, participantName: string, pullRequestData: BitbucketPullRequestModel, botUserSlugs: string[], formerEmployeeSlugs: string[]) {
        this.teamName = teamName;
        this.projectKey = pullRequestData.toRef.repository.project.key;
        this.repositoryName = pullRequestData.toRef.repository.slug;
        this.pullRequestNumber = pullRequestData.id;
        this.participant = await ContributorFactory.fetchContributor({
            teamName: teamName,
            login: participantName,
            isBotUser: botUserSlugs.includes(participantName),
            isFormerEmployee: formerEmployeeSlugs.includes(participantName)
        });
        return this;
    }

    private setCommentStats(participantActivities: BitbucketPullRequestActivityModel[], botUserSlugs: string[]) {
        const comments = getHumanActivities(participantActivities, botUserSlugs, "COMMENTED");

        const commentTimestamps = comments.map(c => c.createdDate as number);
        this.firstCommentDate = commentTimestamps.length ? new Date(Math.min(...commentTimestamps)) : null as any;
        this.lastCommentDate = commentTimestamps.length ? new Date(Math.max(...commentTimestamps)) : null as any;
        this.commentsCount = comments.length;
        return this;
    }

    private setApprovalStats(participantActivities: BitbucketPullRequestActivityModel[], botUserSlugs: string[]) {
        const approvals = getHumanActivities(participantActivities, botUserSlugs, "APPROVED");

        const approvalTimestamps = approvals.map(a => a.createdDate);
        this.firstApprovalDate = approvalTimestamps.length ? new Date(Math.min(...approvalTimestamps)) : null as any;
        this.lastApprovalDate = approvalTimestamps.length ? new Date(Math.max(...approvalTimestamps)) : null as any;
        return this;
    }

}
  