import { ImportParams } from "../ImportParams";
import { ActivityTraits } from "./ActivityTraits";

export default function calculatePrSharedForReviewDate(model: ImportParams): Date {
    const readyForReviewEvents = model.activities.filter(ActivityTraits.isReadyForReviewEvent);
    if (readyForReviewEvents.length > 0) {
        const earliestReadyForReviewEvent = getEarliestTimestamp(readyForReviewEvents.map(a => a.created_at));
        return new Date(earliestReadyForReviewEvent);
    }

    const nonBotReviewerAdditions = getNonBotReviewerAdditions(model);
    if (nonBotReviewerAdditions.length > 0) {
        const reviewersAddedAfterPRCreation = getReviewersAddedAfterPRCreation(nonBotReviewerAdditions, model.pullRequest.created_at);

        // All reviewers were added after PR creation time
        if (reviewersAddedAfterPRCreation.length === nonBotReviewerAdditions.length) {
            const earliestReviewerAdditionDate = getEarliestTimestamp(nonBotReviewerAdditions.map(a => a.created_at));
            return new Date(earliestReviewerAdditionDate);
        }
    }

    return new Date(model.pullRequest.created_at);
}

function getEarliestTimestamp(dates: string[]): number {
    return Math.min(...dates.map(date => new Date(date).getTime()));
}

function getNonBotReviewerAdditions(model: ImportParams): any[] {
    return model.activities
        .filter(ActivityTraits.isReviewRequestedEvent)
        .filter(a => !model.botUserNames.includes((a.requested_reviewer?.login || a.requested_team?.name)!));
}

function getReviewersAddedAfterPRCreation(activities: any[], prCreationDate: string): any[] {
    return activities.filter(addition => new Date(addition.created_at).getTime() > new Date(prCreationDate).getTime());
}