import { Utils } from "./Utils";
import { PullRequest } from "../../metrics-db/PullRequest";
import { BitbucketPullRequestParticipant } from "./BitbucketPullRequestParticipant";
import {
    BitbucketCommitModel,
    BitbucketDiffModel,
    BitbucketPullRequestActivityModel,
    BitbucketPullRequestModel
} from "../api/BitbucketAPI";

export type ImportModel = {
    teamName: string;
    botUserSlugs: string[],
    formerEmployeeSlugs: string[],
    pullRequest: BitbucketPullRequestModel,
    pullRequestActivities: BitbucketPullRequestActivityModel[],
    commits: BitbucketCommitModel[],
    diff: BitbucketDiffModel
}

export class BitbucketPullRequest extends PullRequest {
    constructor(model: ImportModel) {
        super();
        this.initializeBaseProperties(model)
            .initializeDates(model)
            .calculateCommitStats(model)
            .initializeParticipants(model);
    }

    private initializeBaseProperties(model: ImportModel): BitbucketPullRequest {
        this.teamName = model.teamName;
        this.projectKey = model.pullRequest.toRef.repository.project.key;
        this.repositoryName = model.pullRequest.toRef.repository.slug;
        this.pullRequestNumber = model.pullRequest.id;
        this.author = model.pullRequest.author.user.slug;
        this.viewURL = model.pullRequest.links.self[0].href;
        this.authorIsBotUser = model.botUserSlugs.includes(this.author);
        this.authorIsFormerEmployee = model.formerEmployeeSlugs.includes(this.author);
        this.targetBranch = model.pullRequest.toRef.displayId;
        this.reviewersCount = model.pullRequest.reviewers.length;
        return this;
    }

    private initializeDates(model: ImportModel): BitbucketPullRequest {
        this.openedDate = this.calculatePrOpenDate(model);
        this.mergedDate = new Date(model.pullRequest.closedDate);

        const commitTimestamps = model.commits.map((c) => c.authorTimestamp as number);
        this.initialCommitDate = new Date(Math.min(...commitTimestamps));
        this.lastCommitDate = new Date(Math.max(...commitTimestamps));

        return this;
    }

    private calculateCommitStats(model: ImportModel): BitbucketPullRequest {
        this.commentsCount = Utils.getHumanActivities(model.pullRequestActivities, model.botUserSlugs, "COMMENTED").length;
        this.diffSize = BitbucketPullRequest.getDiffSize(model.diff);
        this.testsWereTouched = BitbucketPullRequest.testsWereTouched(model.diff);
        return this;
    }

    private initializeParticipants(model: ImportModel): BitbucketPullRequest {
        const allParticipants = new Set<string>([
            ...model.pullRequest.reviewers.map(r => r.user.slug),
            ...model.pullRequest.participants.map(p => p.user.slug)
        ]);

        this.participants = Array.from(allParticipants).map((participantName) =>
            new BitbucketPullRequestParticipant(
                participantName,
                model.pullRequest,
                BitbucketPullRequest.getActivitiesOf(model.pullRequestActivities, participantName),
                model.botUserSlugs,
                model.formerEmployeeSlugs
            )
        );
        return this;
    }

    private calculatePrOpenDate(model: ImportModel): Date {
        const reviewerAdditions = model.pullRequestActivities.filter(a => "addedReviewers" in a);

        if (reviewerAdditions.length > 0) {
            const initialReviewersSlugs = new Set<string>(model.pullRequest.reviewers.map(r=> r.user.slug).filter(s => !model.botUserSlugs.includes(s)));
            const addedReviewersSlugs = new Set<string>(reviewerAdditions.flatMap(a => a.addedReviewers?.map(r => r.slug) || []));

            // If all initial reviewers were added after PR was opened
            if ([...initialReviewersSlugs].every(s => addedReviewersSlugs.has(s))) {
                // Return the date of the earliest activity where reviewers were added
                const earliestAddingDate = Math.min(...reviewerAdditions.map(activity => activity.createdDate));
                return new Date(earliestAddingDate);
            }
        }
        return new Date(model.pullRequest.createdDate);
    }
    private static getActivitiesOf(activities: BitbucketPullRequestActivityModel[], userName: string): any[] {
        return activities.filter(a => a.user.slug === userName);
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
