import { ImportParams } from "../ImportParams";
import getCommentsTimestamps from "./getCommentsTimestamps";
import { ActivityTraits } from "./ActivityTraits";

export default function calculatePrSharedForReviewDate(model: ImportParams): Date {
    const readyForReviewEvents = model.pullRequestActivities.filter(ActivityTraits.isReadyForReviewEvent);
    if (readyForReviewEvents.length > 0) {
        return new Date(getEarliestDate(readyForReviewEvents.map(a => a.created_at)));
    }

    const nonBotReviewerAdditions = getNonBotReviewerAdditions(model);

    if (nonBotReviewerAdditions.length > 0) {
        const reviewersAddedAfterPRCreation = getReviewersAddedAfterPRCreation(nonBotReviewerAdditions, model.pullRequest.created_at);

        // All reviewers were added after PR creation time
        if (reviewersAddedAfterPRCreation.length === nonBotReviewerAdditions.length) {
            const earliestReviewerAdditionDate = getEarliestDate(nonBotReviewerAdditions.map(a => a.created_at));

            const firstCommentDate = getEarliestCommentDate(model);

            if (!firstCommentDate || firstCommentDate > earliestReviewerAdditionDate) {
                return new Date(earliestReviewerAdditionDate);
            }
        }
    }

    return new Date(model.pullRequest.created_at);
}

function getEarliestDate(dates: string[]): number {
    return Math.min(...dates.map(date => new Date(date).getTime()));
}

function getNonBotReviewerAdditions(model: ImportParams): any[] {
    return model.pullRequestActivities
        .filter(ActivityTraits.isReviewRequestedEvent)
        .filter(a => !model.botUserNames.includes(a.requested_reviewer?.login || a.requested_team?.name));
}

function getReviewersAddedAfterPRCreation(activities: any[], prCreationDate: string): any[] {
    return activities.filter(addition => new Date(addition.created_at).getTime() > new Date(prCreationDate).getTime());
}

function getEarliestCommentDate(model: ImportParams): number | null {
    const commentTimeStamps = getCommentsTimestamps(model.pullRequestActivities, model.botUserNames);
    return commentTimeStamps.length ? Math.min(...commentTimeStamps) : null;
}
