import { Utils } from "./Utils";
import { PullRequest } from "../../metrics-db/PullRequest";
import { BitbucketPullRequestParticipant } from "./BitbucketPullRequestParticipant";
import { BitbucketDiffModel, BitbucketPullRequestActivityModel } from "../api/BitbucketAPI";

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
            .calculateCommitStats(model)
            .initializeParticipants(model);
    }

    private initializeBaseProperties(model: BitbucketPullRequestImportModel): BitbucketPullRequest {
        this.teamName = model.teamName;
        this.projectKey = model.pullRequest.toRef.repository.project.key;
        this.repositoryName = model.pullRequest.toRef.repository.slug;
        this.pullRequestNumber = model.pullRequest.id;
        this.author = Utils.normalizeUserName(model.pullRequest.author.user.name);
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
        return this;
    }

    private calculateCommitStats(model: BitbucketPullRequestImportModel): BitbucketPullRequest {
        this.commentsCount = Utils.getHumanActivities(model.pullRequestActivities, model.botUsers, "COMMENTED").length;
        this.rebasesCount = BitbucketPullRequest.getRebases(model.pullRequestActivities).length;
        this.diffSize = BitbucketPullRequest.getDiffSize(model.diff);
        this.testsWereTouched = BitbucketPullRequest.testsWereTouched(model.diff);
        return this;
    }

    private initializeParticipants(model: BitbucketPullRequestImportModel): BitbucketPullRequest {
        const allParticipants = new Set<string>([
            ...model.pullRequest.reviewers.map((r: any) => Utils.normalizeUserName(r.user.name)),
            ...model.pullRequest.participants.map((p: any) => Utils.normalizeUserName(p.user.name))
        ]);

        this.participants = Array.from(allParticipants).map((participantName) =>
            new BitbucketPullRequestParticipant(
                participantName,
                model.pullRequest,
                BitbucketPullRequest.getActivitiesOf(model.pullRequestActivities, participantName),
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
    private static getActivitiesOf(activities: BitbucketPullRequestActivityModel[], userName: string): any[] {
        return activities.filter(a => Utils.normalizeUserName(a.user.name) === Utils.normalizeUserName(userName));
    }


    private static getRebases(activities: BitbucketPullRequestActivityModel[]): any[] {
        return activities.filter(a => a.action === "RESCOPED" && a.fromHash !== a.previousFromHash);
    }

    private static getDiffSize(diffData: BitbucketDiffModel): number {
        let linesChanged = 0;
        diffData.diffs.forEach((d: any) => {
            if (!d.hunks) return;
            d.hunks.forEach((hunk: any) => {
                hunk.segments.forEach((segment: any) => {
                    if (segment.type === "ADDED" || segment.type === "DELETED") {
                        linesChanged += segment.lines.length;
                    }
                });
            });
        });
        return linesChanged;
    }
    private static testsWereTouched(prDiff: any): boolean {
        return prDiff.diffs.some((diff: any) => diff.destination?.toString.includes("test"));
    }
}
