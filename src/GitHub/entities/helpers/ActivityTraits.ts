import {
    GitHubPullRequestActivityCommentedModel,
    GitHubPullRequestActivityCommitedModel,
    GitHubPullRequestActivityLineCommentedModel, GitHubPullRequestActivityMergedModel,
    GitHubPullRequestActivityModel,
    GitHubPullRequestActivityReadyForReviewModel,
    GitHubPullRequestActivityReviewedModel,
    GitHubPullRequestReviewRequestActivityModel
} from "../../GitHubAPI.contracts";

export const ActivityTraits = {
    isCommitedEvent(event: GitHubPullRequestActivityModel): event is GitHubPullRequestActivityCommitedModel {
        return event.event === "committed";
    },
    isCommentedEvent(event: GitHubPullRequestActivityModel): event is GitHubPullRequestActivityCommentedModel {
        return event.event === "commented";
    },
    isLineCommentedEvent(event: GitHubPullRequestActivityModel): event is GitHubPullRequestActivityLineCommentedModel {
        return event.event === "line-commented";
    },
    isReviewRequestedEvent(event: GitHubPullRequestActivityModel): event is GitHubPullRequestReviewRequestActivityModel {
        return event.event === "review_requested";
    },
    isReviewRequestRemovedEvent(event: GitHubPullRequestActivityModel): event is GitHubPullRequestReviewRequestActivityModel {
        return event.event === "review_request_removed";
    },
    isReadyForReviewEvent(event: GitHubPullRequestActivityModel): event is GitHubPullRequestActivityReadyForReviewModel {
        return event.event === "ready_for_review";
    },
    isReviewedEvent(event: GitHubPullRequestActivityModel): event is GitHubPullRequestActivityReviewedModel {
        return event.event === "reviewed";
    },
    isConsistentReviewedEvent(event: GitHubPullRequestActivityModel): event is GitHubPullRequestActivityReviewedModel {
        // Deleted GitHub users are replaced by https://github.com/ghost which is represented as a null in the review event
        return event.event === "reviewed" && !!event.user;
    },
    isConsistentMergedEvent(event: GitHubPullRequestActivityModel): event is GitHubPullRequestActivityMergedModel {
        return event.event === "merged" && !!event.actor;
    }
};