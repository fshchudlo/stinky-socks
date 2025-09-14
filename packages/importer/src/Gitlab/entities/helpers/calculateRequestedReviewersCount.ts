import { ImportParams } from "../ImportParams";
import { ActivityTraits } from "./ActivityTraits";

export function calculateRequestedReviewersCount(model: ImportParams) {
    const requestedReviewers = model.activities
        .filter(ActivityTraits.isReviewRequestedEvent)
        .flatMap(r => r.added_reviewers)
        .map(u => u.username);

    const removedReviewers = model.activities
        .filter(ActivityTraits.isReviewRequestRemovedEvent)
        .flatMap(r => r.removed_reviewers)
        .map(u => u.username);

    const remainedReviewers = requestedReviewers
        .filter(reviewer => !removedReviewers.includes(reviewer));

    const reactedReviewers = model.activities
        .filter(ActivityTraits.isReviewedEvent)
        .filter(a => !a.author.bot)
        .map(r => r.author.username);

    return new Set([...reactedReviewers, ...remainedReviewers]).size;
}