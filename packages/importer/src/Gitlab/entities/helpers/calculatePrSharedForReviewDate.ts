import { ImportParams } from "../ImportParams";
import { ActivityTraits } from "./ActivityTraits";
import { GitlabPullRequestActivityModel, GitlabUserModel } from "../../GitlabAPI.contracts";

export default function calculatePrSharedForReviewDate(model: ImportParams): Date {
    const readyForReviewEvents = model.activities.filter(ActivityTraits.isReadyForReviewEvent);
    if (readyForReviewEvents.length > 0) {
        const earliestReadyForReviewEvent = getEarliestTimestamp(readyForReviewEvents.map(a => a.created_at));
        return new Date(earliestReadyForReviewEvent);
    }

    if (isAllReviewersAddedAfterPRCreation(model.activities, model.pullRequest.created_at, model.pullRequest.author)) {
        const earliestReviewerAdditionDate = getEarliestTimestamp(model.activities.filter(ActivityTraits.isReviewRequestedEvent).map(a => a.created_at));
        return new Date(earliestReviewerAdditionDate);
    }
    return new Date(model.pullRequest.created_at);
}

function getEarliestTimestamp(dates: string[]): number {
    return Math.min(...dates.map(date => new Date(date).getTime()));
}

function isAllReviewersAddedAfterPRCreation(activities: GitlabPullRequestActivityModel[], prCreationDate: string, prAuthor: GitlabUserModel): boolean {
    const reviewersAddedByAuthor = activities
        .filter(ActivityTraits.isReviewRequestedEvent)
        .filter(r => r.author?.id == prAuthor.id);

    const reviewersAddedAfterPRCreation = reviewersAddedByAuthor
        .filter(addition => new Date(addition.created_at).getTime() > new Date(prCreationDate).getTime());

    return reviewersAddedByAuthor.length > 0
        && reviewersAddedAfterPRCreation
            .flatMap(r => r.added_reviewers).length
        ===
        reviewersAddedByAuthor
            .flatMap(r => r.added_reviewers).length;
}