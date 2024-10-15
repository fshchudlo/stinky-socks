import { BitbucketHelpers } from "./BitbucketHelpers";
import { PullRequest } from "../../metrics-db/PullRequest";
import { BitbucketPullRequestParticipant } from "./BitbucketPullRequestParticipant";

export type BitbucketPullRequestImportModel = {
    teamName: string;
    botUsers: string[],
    formerEmployees: string[],
    pullRequest: any,
    pullRequestActivities: any[],
    commits: any[],
    diff: any
}

export class BitbucketPullRequest extends PullRequest {
    constructor(model: BitbucketPullRequestImportModel) {
        super();
        this.initializeBaseProperties(model)
            .initializeDates(model)
            .calculateApprovalAndReviewStats(model)
            .calculateTaskStats(model)
            .calculateCommitStats(model)
            .buildParticipants(model);
    }

    private initializeBaseProperties(model: BitbucketPullRequestImportModel): BitbucketPullRequest {
        this.teamName = model.teamName;
        this.projectKey = model.pullRequest.toRef.repository.project.key;
        this.repositoryName = model.pullRequest.toRef.repository.slug;
        this.pullRequestNumber = model.pullRequest.id;
        this.author = BitbucketHelpers.normalizeUserName(model.pullRequest.author.user.name);
        this.viewURL = model.pullRequest.links.self[0].href;
        this.authorIsBotUser = model.botUsers.includes(this.author);
        this.authorIsFormerEmployee = model.formerEmployees.includes(this.author);
        this.targetBranch = model.pullRequest.toRef.displayId;
        return this;
    }

    private initializeDates(model: BitbucketPullRequestImportModel): BitbucketPullRequest {

        this.openedDate = this.calculatePrOpenDate(model);
        this.mergedDate = new Date(model.pullRequest.closedDate);

        const commitTimestamps = model.commits.map((c) => c.authorTimestamp as number);
        this.initialCommitDate = new Date(Math.min(...commitTimestamps));
        this.lastCommitDate = new Date(Math.max(...commitTimestamps));
        return this;
    }

    private calculateApprovalAndReviewStats(model: BitbucketPullRequestImportModel): BitbucketPullRequest {
        this.reviewersCount = model.pullRequest.reviewers.length;
        this.participantsCount = model.pullRequest.participants.length;
        this.approvalsCount = BitbucketHelpers.getApprovers(model.pullRequestActivities, model.botUsers).size;
        return this;
    }

    private calculateTaskStats(model: BitbucketPullRequestImportModel): BitbucketPullRequest {
        this.resolvedTasksCount = model.pullRequest.properties?.resolvedTaskCount || 0;
        this.openTasksCount = model.pullRequest.properties?.openTaskCount || 0;
        return this;
    }

    private calculateCommitStats(model: BitbucketPullRequestImportModel): BitbucketPullRequest {
        this.commentsCount = BitbucketHelpers.getHumanActivities(model.pullRequestActivities, model.botUsers, "COMMENTED").length;
        this.commitsAfterFirstApprovalCount = model.commits.filter(
            (c) => new Date(c.committerTimestamp) > this.openedDate
        ).length;
        this.rebasesCount = BitbucketHelpers.getRebases(model.pullRequestActivities).length;
        this.diffSize = BitbucketHelpers.getDiffSize(model.diff);
        this.testsWereTouched = BitbucketHelpers.testsWereTouched(model.diff);
        return this;
    }

    private buildParticipants(model: BitbucketPullRequestImportModel): BitbucketPullRequest {
        const allParticipants = new Set<string>([
            ...model.pullRequest.reviewers.map((r: any) => BitbucketHelpers.normalizeUserName(r.user.name)),
            ...model.pullRequest.participants.map((p: any) => BitbucketHelpers.normalizeUserName(p.user.name))
        ]);

        this.participants = Array.from(allParticipants).map((participantName) =>
            new BitbucketPullRequestParticipant(
                participantName,
                model.pullRequest,
                BitbucketHelpers.getActivitiesOf(model.pullRequestActivities, participantName),
                model.botUsers,
                model.formerEmployees
            )
        );
        return this;
    }

    private calculatePrOpenDate(model: BitbucketPullRequestImportModel): Date {
        const reviewerAdditions = model.pullRequestActivities.filter(a => "addedReviewers" in a);

        if (reviewerAdditions.length > 0) {
            const initialReviewersNames = new Set<string>(model.pullRequest.reviewers.map((r: any) => r.user.name).filter((name: string) => !model.botUsers.includes(name)));
            const addedReviewersNames = new Set<string>(reviewerAdditions.flatMap(a => a.addedReviewers?.map((r: any) => r.name) || []));

            // If all initial reviewers were added after PR was opened
            if ([...initialReviewersNames].every(name => addedReviewersNames.has(name))) {
                // Return the date of the earliest activity where reviewers were added
                const earliestAddingDate = Math.min(...reviewerAdditions.map(activity => activity.createdDate));
                return new Date(earliestAddingDate);
            }
        }
        return new Date(model.pullRequest.createdDate);
    }
}
