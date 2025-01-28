import { ImportParams } from "../ImportParams";
import { ActivityTraits } from "./ActivityTraits";
import { GitHubPullRequestActivityModel, GitHubUserModel } from "../../GitHubAPI.contracts";

export default function calculatePrSharedForReviewDate(model: ImportParams): Date {
    const readyForReviewEvents = model.activities.filter(ActivityTraits.isReadyForReviewEvent);
    if (readyForReviewEvents.length > 0) {
        const earliestReadyForReviewEvent = getEarliestTimestamp(readyForReviewEvents.map(a => a.created_at));
        return new Date(earliestReadyForReviewEvent);
    }

    if (isAllReviewersAddedAfterPRCreation(model.activities, model.pullRequest.created_at, model.pullRequest.user)) {
        const earliestReviewerAdditionDate = getEarliestTimestamp(model.activities.filter(ActivityTraits.isReviewRequestedEvent).map(a => a.created_at));
        return new Date(earliestReviewerAdditionDate);
    }
    return new Date(model.pullRequest.created_at);
}

function getEarliestTimestamp(dates: string[]): number {
    return Math.min(...dates.map(date => new Date(date).getTime()));
}

function isAllReviewersAddedAfterPRCreation(activities: GitHubPullRequestActivityModel[], prCreationDate: string, prAuthor: GitHubUserModel): boolean {
    const reviewersAddedByAuthor = activities
        .filter(ActivityTraits.isReviewRequestedEvent)
        .filter(r => r.actor?.id == prAuthor.id);

    const reviewersAddedAfterPRCreation = reviewersAddedByAuthor.filter(addition => new Date(addition.created_at).getTime() > new Date(prCreationDate).getTime());

    return reviewersAddedByAuthor.length > 0 && reviewersAddedAfterPRCreation.length === reviewersAddedByAuthor.length;
}