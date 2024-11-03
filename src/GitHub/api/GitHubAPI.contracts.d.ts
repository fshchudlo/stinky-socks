import { PullRequestAuthorRole } from "../../MetricsDB/entities/PullRequestAuthorRole";

export type GitHubPullRequestModel = {
    author_association: PullRequestAuthorRole;
    base: {
        repo: {
            owner: GitHubUserModel;
            name: string;
        };
        ref: string;
    };
    number: number;
    user: GitHubUserModel;
    html_url: string;
    requested_reviewers: GitHubUserModel[];
    assignees: GitHubUserModel[];
    created_at: string;
    updated_at: string;
    merged_at: string;
};

export type GitHubPullRequestActivityModel =
    GitHubPullRequestActivityLineCommentedModel
    | GitHubPullRequestActivityCommitedModel
    | GitHubPullRequestActivityCommentedModel
    | GitHubPullRequestActivityReviewRequestedModel
    | GitHubPullRequestActivityReviewedModel
    | GitHubPullRequestActivityReadyForReviewModel
    | GitHubPullRequestActivityMergedModel;

export type GitHubPullRequestActivityLineCommentedModel = {
    event: "line-commented";
    comments: {
        created_at: string;
        user: GitHubUserModel
    }[];
};

export type GitHubPullRequestActivityCommitedModel = {
    event: "committed";
    committer: {
        date: string;
    };
    author: {
        date: string;
    };
};
export type GitHubPullRequestActivityCommentedModel = {
    event: "commented";
    user: GitHubUserModel;
    created_at: string;
    actor: GitHubUserModel;
};
export type GitHubPullRequestActivityReviewRequestedModel = {
    event: "review_requested";
    actor: GitHubUserModel;
    requested_reviewer: GitHubUserModel;
    requested_team: { name: string };
    created_at: string;
};
export type GitHubPullRequestActivityReviewedModel = {
    body: string;
    event: "reviewed";
    state: "approved" | "changes_requested" | "commented" | "dismissed" | "pending";
    submitted_at: string;
    user?: GitHubUserModel;
};
export type GitHubPullRequestActivityMergedModel = {
    event: "merged";
    created_at: string;
    actor: GitHubUserModel;
};
export type GitHubPullRequestActivityReadyForReviewModel = {
    event: "ready_for_review";
    created_at: string;
    actor: GitHubUserModel;
};


export type GitHubFileDiffModel = {
    additions: number;
    deletions: number;
    filename: string;
};
export type GitHubUserModel = {
    login: string;
};
