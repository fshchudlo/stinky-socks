import getHumanActivities from "./getHumanActivities";
import { PullRequest } from "../../MetricsDB/PullRequest";
import { BitbucketPullRequestParticipant } from "./BitbucketPullRequestParticipant";
import {
    BitbucketCommitModel,
    BitbucketDiffModel,
    BitbucketPullRequestActivityModel,
    BitbucketPullRequestModel
} from "../api/BitbucketAPI";
import { ContributorFactory } from "../../MetricsDB/ContributorFactory";

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
    public async init(model: ImportModel): Promise<BitbucketPullRequest> {
        return await (await this.initializeBaseProperties(model))
            .initializeDates(model)
            .calculateCommitStats(model)
            .initializeParticipants(model);
    }

    private async initializeBaseProperties(model: ImportModel) {
        this.teamName = model.teamName;
        this.projectKey = model.pullRequest.toRef.repository.project.key;
        this.repositoryName = model.pullRequest.toRef.repository.slug;
        this.pullRequestNumber = model.pullRequest.id;
        this.viewURL = model.pullRequest.links.self[0].href;
        this.targetBranch = model.pullRequest.toRef.displayId;
        this.reviewersCount = model.pullRequest.reviewers.length;
        this.authorRole = "CONTRIBUTOR"

        const authorLogin = model.pullRequest.author.user.slug;
        this.author = await ContributorFactory.fetchContributor({
            teamName: model.teamName,
            login: authorLogin,
            isBotUser: model.botUserSlugs.includes(authorLogin),
            isFormerEmployee: model.formerEmployeeSlugs.includes(authorLogin)
        });
        return this;
    }

    private initializeDates(model: ImportModel) {
        this.openedDate = this.calculatePrOpenDate(model);
        this.mergedDate = new Date(model.pullRequest.closedDate);

        const commitTimestamps = model.commits.map((c) => c.authorTimestamp as number);
        this.initialCommitDate = new Date(Math.min(...commitTimestamps));
        this.lastCommitDate = new Date(Math.max(...commitTimestamps));

        return this;
    }

    private calculateCommitStats(model: ImportModel) {
        this.commentsCount = getHumanActivities(model.pullRequestActivities, model.botUserSlugs, "COMMENTED").length;
        this.diffSize = BitbucketPullRequest.getDiffSize(model.diff);
        this.testsWereTouched = BitbucketPullRequest.testsWereTouched(model.diff);
        return this;
    }

    private async initializeParticipants(model: ImportModel) {
        const allParticipants = new Set<string>([
            ...model.pullRequest.reviewers.map(r => r.user.slug),
            ...model.pullRequest.participants.map(p => p.user.slug)
        ]);

        this.participants = [];
        for (const participantName of Array.from(allParticipants)) {
            this.participants.push(await new BitbucketPullRequestParticipant().init(
                model.teamName,
                participantName,
                model.pullRequest,
                BitbucketPullRequest.getActivitiesOf(model.pullRequestActivities, participantName),
                model.botUserSlugs,
                model.formerEmployeeSlugs
            ));
        }
        return this;
    }

    private calculatePrOpenDate(model: ImportModel): Date {
        const reviewerAdditions = model.pullRequestActivities.filter(a => "addedReviewers" in a);

        if (reviewerAdditions.length > 0) {
            const initialReviewersSlugs = new Set<string>(model.pullRequest.reviewers.map(r => r.user.slug).filter(s => !model.botUserSlugs.includes(s)));
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

    private static getActivitiesOf(activities: BitbucketPullRequestActivityModel[], userName: string) {
        return activities.filter(a => a.user.slug === userName);
    }

    private static getDiffSize(diffData: BitbucketDiffModel): number {
        let linesChanged = 0;
        diffData.diffs.forEach(d => {
            if (!d.hunks) return;
            d.hunks.forEach(hunk => {
                hunk.segments.forEach(segment => {
                    if (segment.type === "ADDED" || segment.type === "DELETED") {
                        linesChanged += segment.lines.length;
                    }
                });
            });
        });
        return linesChanged;
    }

    private static testsWereTouched(prDiff: BitbucketDiffModel) {
        return prDiff.diffs.some(diff => diff.destination?.toString.includes("test"));
    }
}
