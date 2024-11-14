import { ImportParams } from "../ImportParams";
import { ActivityTraits } from "./ActivityTraits";

/*
* In case of imported data pull request not always contains the information about reviewers.
* So, we take it from events.
* Another point is that GitHub sometimes GitHub replays review request removal events but omits review requests events.
* So, we take all the request events and subtract the removal events but only for the users who was requested.
* */
export function calculateReviewersCount(model: ImportParams) {
    const requestedReviewers = model.activities
        .filter(ActivityTraits.isReviewRequestedEvent)
        .filter(r => r.requested_reviewer)
        .map(r => r.requested_reviewer!.login);

    const removedReviewers = model.activities
        .filter(ActivityTraits.isReviewRequestRemovedEvent)
        .filter(r => r.requested_reviewer)
        .map(r => r.requested_reviewer!.login);

    const reactedReviewers = model.activities
        .filter(ActivityTraits.isReviewedEvent)
        .filter(r => r.user)
        .map(r => r.user!.login);

    const remainedReviewers = requestedReviewers
        .filter(reviewer => !removedReviewers.includes(reviewer));

    return new Set([...reactedReviewers, ...remainedReviewers]).size;
}