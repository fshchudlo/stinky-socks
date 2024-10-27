import { PullRequest } from "../../MetricsDB/PullRequest";
import { BitbucketPullRequestParticipant } from "./BitbucketPullRequestParticipant";
import { BitbucketDiffModel, BitbucketPullRequestActivityModel } from "../api/BitbucketAPI.contracts";
import { ContributorFactory } from "../../MetricsDB/ContributorFactory";
import { ImportParams } from "./ImportParams";
import { PullRequestAuthorRole } from "../../MetricsDB/PullRequestAuthorRole";

export class BitbucketPullRequest extends PullRequest {
    public async init(model: ImportParams): Promise<BitbucketPullRequest> {
        return await (await this.initializeBaseProperties(model))
            .initializeDates(model)
            .calculateCommitStats(model)
            .initializeParticipants(model);
    }

    private async initializeBaseProperties(model: ImportParams) {
        this.teamName = model.teamName;
        this.projectName = model.pullRequest.toRef.repository.project.key;
        this.repositoryName = model.pullRequest.toRef.repository.slug;
        this.pullRequestNumber = model.pullRequest.id;
        this.viewURL = model.pullRequest.links.self[0].href;
        this.targetBranch = model.pullRequest.toRef.displayId;
        this.reviewersCount = model.pullRequest.reviewers.length;
        this.authorRole = PullRequestAuthorRole.MEMBER;
        this.createdDate = new Date(model.pullRequest.createdDate);
        this.updatedDate = new Date(model.pullRequest.updatedDate);

        const authorLogin = model.pullRequest.author.user.slug;
        this.author = await ContributorFactory.fetchContributor({
            teamName: model.teamName,
            login: authorLogin,
            isBotUser: model.botUserSlugs.includes(authorLogin),
            isFormerEmployee: model.formerEmployeeSlugs.includes(authorLogin)
        });
        return this;
    }

    private initializeDates(model: ImportParams) {
        this.sharedForReviewDate = this.calculatePrSharedForReviewDate(model);
        this.mergedDate = new Date(model.pullRequest.closedDate);

        const commitTimestamps = model.commits.map((c) => c.authorTimestamp as number);
        this.initialCommitDate = new Date(Math.min(...commitTimestamps));
        this.lastCommitDate = new Date(Math.max(...commitTimestamps));

        return this;
    }

    private calculateCommitStats(model: ImportParams) {
        this.totalCommentsCount = model.pullRequestActivities
            .filter(a => a.action === "COMMENTED")
            .filter(a => !model.botUserSlugs.includes(a.user.slug)).length;
        this.diffSize = BitbucketPullRequest.getDiffSize(model.diff);
        this.testsWereTouched = BitbucketPullRequest.testsWereTouched(model.diff);
        return this;
    }

    private async initializeParticipants(model: ImportParams) {
        const allParticipants = new Set<string>([
            ...model.pullRequest.reviewers.map(r => r.user.slug),
            ...model.pullRequest.participants.map(p => p.user.slug)
        ]);

        this.participants = await Promise.all(
            Array.from(allParticipants)
                .filter(p => p !== model.pullRequest.author.user.slug)
                .map(async participantName => {
                    const participantUser = await ContributorFactory.fetchContributor({
                        teamName: model.teamName,
                        login: participantName,
                        isBotUser: model.botUserSlugs.includes(participantName),
                        isFormerEmployee: model.formerEmployeeSlugs.includes(participantName)
                    });
                    return new BitbucketPullRequestParticipant(
                        model.teamName,
                        model.pullRequest,
                        BitbucketPullRequest.getActivitiesOf(model.pullRequestActivities, participantName),
                        participantUser
                    );
                }));
        return this;
    }

    private calculatePrSharedForReviewDate(model: ImportParams): Date {
        const reviewerAdditions = model.pullRequestActivities.filter(a => "addedReviewers" in a);

        if (reviewerAdditions.length > 0) {
            const initialReviewersSlugs = new Set<string>(model.pullRequest.reviewers.map(r => r.user.slug).filter(s => !model.botUserSlugs.includes(s)));
            const addedReviewersSlugs = new Set<string>(reviewerAdditions.flatMap(a => a.addedReviewers?.map(r => r.slug) || []));

            // If all reviewers were added after PR was opened
            if ([...initialReviewersSlugs].every(s => addedReviewersSlugs.has(s))) {
                return new Date(Math.min(...reviewerAdditions.map(activity => activity.createdDate)));
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
