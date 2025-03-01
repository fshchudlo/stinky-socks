import {GitHubPullRequestAuthorRole} from "./GitHubPullRequestAuthorRole";

export type GitHubPullRequestModel = {
    author_association: GitHubPullRequestAuthorRole;
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
    | GitHubPullRequestReviewRequestActivityModel
    | GitHubPullRequestActivityReviewedModel
    | GitHubPullRequestActivityReadyForReviewModel
    | GitHubPullRequestActivityMergedModel;

export type GitHubPullRequestActivityLineCommentedModel = {
    event: "line-commented";
    comments: {
        created_at: string;
        user: GitHubUserModel | null;
        body: string;
        html_url: string;
    }[];
};

export type GitHubPullRequestActivityCommitedModel = {
    event: "committed";
    message: string;
    html_url: string;
    committer: {
        name: string;
        date: string;
    };
    author: {
        name: string;
        date: string;
    };
};
export type GitHubPullRequestActivityCommentedModel = {
    event: "commented";
    user: GitHubUserModel;
    created_at: string;
    actor: GitHubUserModel;
    body: string;
    html_url: string;
};
export type GitHubPullRequestReviewRequestActivityModel = {
    event: "review_requested" | "review_request_removed";
    actor: GitHubUserModel;
    requested_reviewer?: GitHubUserModel;
    requested_team?: { name: string };
    created_at: string;
};
export type GitHubPullRequestActivityReviewedModel = {
    body: string | null;
    event: "reviewed";
    state: "approved" | "changes_requested" | "commented" | "dismissed" | "pending";
    html_url: string;
    submitted_at: string;
    // Deleted GitHub users are replaced by https://github.com/ghost which is represented as a null in the review event
    user: GitHubUserModel | null;
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
    id: number;
    login: string;
    type: "User" | "Organization" | "Mannequin" | "Bot";
    html_url: string;
};

export type GitHubPullRequestAuthorRole =
/** The author is the owner of the repository. */
    "OWNER" |
    /** The author is a member of the organization that owns the repository. */
    "MEMBER" |
    /** The author has write access to the repository. */
    "COLLABORATOR" |
    /** The author is making their first contribution to any repository in the organization. */
    "FIRST_TIMER" |
    /** The author is contributing to this particular repository for the first time. */
    "FIRST_TIME_CONTRIBUTOR" |
    /** The author has previously committed to the repository but is not necessarily a member or collaborator. */
    "CONTRIBUTOR" |
    /** The author is a placeholder for a previously deleted user. */
    "MANNEQUIN" |
    /** The author has no affiliation with the repository. */
    "NONE"