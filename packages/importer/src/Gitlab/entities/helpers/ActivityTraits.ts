import {
    GitlabPullRequestActivityModel,
    GitlabPullRequestReviewRequestedActivityModel
} from "../../GitlabAPI.contracts";

export const ActivityTraits = {
    isCommentedEvent(event: GitlabPullRequestActivityModel): event is GitlabPullRequestActivityModel {
        return event.type === "DiscussionNote" || event.type === "DiffNote";
    },
    isReviewedEvent(event: GitlabPullRequestActivityModel): event is GitlabPullRequestActivityModel {
        return ActivityTraits.isUnapprovedEvent(event)
            || ActivityTraits.isRequestedChangesEvent(event)
            || ActivityTraits.isApprovedEvent(event);
    },
    isRequestedChangesEvent(event: GitlabPullRequestActivityModel): event is GitlabPullRequestActivityModel {
        return event.type === null && event.body === "requested changes";
    },
    isUnapprovedEvent(event: GitlabPullRequestActivityModel): event is GitlabPullRequestActivityModel {
        return event.type === null && event.body === "unapproved this merge request";
    },
    isApprovedEvent(event: GitlabPullRequestActivityModel): event is GitlabPullRequestActivityModel {
        return event.type === null && event.body === "approved this merge request";
    },
    isReviewRequestedEvent(event: GitlabPullRequestActivityModel): event is GitlabPullRequestReviewRequestedActivityModel {
        return event.type === null && (<GitlabPullRequestReviewRequestedActivityModel>event).added_reviewers?.length > 0;
    },
    isReviewRequestRemovedEvent(event: GitlabPullRequestActivityModel): event is GitlabPullRequestReviewRequestedActivityModel {
        return event.type === null && (<GitlabPullRequestReviewRequestedActivityModel>event).removed_reviewers?.length > 0;
    },
    isReadyForReviewEvent(event: GitlabPullRequestActivityModel): event is GitlabPullRequestActivityModel {
        console.warn("ActivityTraits.isReadyForReviewEvent was not tested properly");

        return event.type == null && event.body == "marked this merge request as ready";
    }
};