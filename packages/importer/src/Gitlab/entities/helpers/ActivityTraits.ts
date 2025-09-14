import {
    GitlabPullRequestActivityModel,
    GitlabPullRequestReviewRequestedActivityModel
} from "../../GitlabAPI.contracts";

export const ActivityTraits = {
    isCommentedEvent(event: GitlabPullRequestActivityModel): event is GitlabPullRequestActivityModel {
        return event.type === "DiscussionNote";
    },
    isReviewedEvent(event: GitlabPullRequestActivityModel): event is GitlabPullRequestActivityModel {
        const reviewEvents = ["unapproved this merge request", "requested changes"];
        return (event.type === null && reviewEvents.includes(event.body))
            || ActivityTraits.isApprovedEvent(event);
    },
    isApprovedEvent(event: GitlabPullRequestActivityModel): event is GitlabPullRequestActivityModel {
        return event.type === null && event.body === "approved this merge request";
    },
    isReviewRequestedEvent(event: GitlabPullRequestActivityModel): event is GitlabPullRequestReviewRequestedActivityModel {
        return event.type === null && (<GitlabPullRequestReviewRequestedActivityModel>event).added_reviewers?.length > 0;
    },
    isReviewRequestRemovedEvent(event: GitlabPullRequestActivityModel): event is GitlabPullRequestReviewRequestedActivityModel {
        return event.type === null && (<GitlabPullRequestReviewRequestedActivityModel>event).removed_reviewers?.length > 0;
    }
};