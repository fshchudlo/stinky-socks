import {
    GitHubPullRequestActivityCommentedModel,
    GitHubPullRequestActivityCommitedModel,
    GitHubPullRequestActivityLineCommentedModel, GitHubPullRequestActivityMergedModel,
    GitHubPullRequestActivityModel,
    GitHubPullRequestActivityReadyForReviewModel,
    GitHubPullRequestActivityReviewedModel,
    GitHubPullRequestActivityReviewRequestedModel
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
    isReviewRequestedEvent(event: GitHubPullRequestActivityModel): event is GitHubPullRequestActivityReviewRequestedModel {
        return event.event === "review_requested";
    },
    isReviewRequestRemovedEvent(event: GitHubPullRequestActivityModel): event is GitHubPullRequestActivityReviewRequestedModel {
        return event.event === "review_request_removed";
    },
    isReadyForReviewEvent(event: GitHubPullRequestActivityModel): event is GitHubPullRequestActivityReadyForReviewModel {
        return event.event === "ready_for_review";
    },
    isReviewedEvent(event: GitHubPullRequestActivityModel): event is GitHubPullRequestActivityReviewedModel {
        return event.event === "reviewed";
    },
    isMergedEvent(event: GitHubPullRequestActivityModel): event is GitHubPullRequestActivityMergedModel {
        return event.event === "merged";
    }
};