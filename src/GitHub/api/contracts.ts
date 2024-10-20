export type GitHubPullRequestModel = {
    author_association: "COLLABORATOR" | "CONTRIBUTOR" | "FIRST_TIMER" | "FIRST_TIME_CONTRIBUTOR" | "MEMBER" | "OWNER" | "MANNEQUIN" | "NONE";
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
    | GitHubPullRequestActivityReadyForReviewModel;

export type GitHubPullRequestActivityLineCommentedModel = {
    event: "line-commented";
    comments: {
        created_at: string;
        user: GitHubUserModel
    }[];
};

export type GitHubPullRequestActivityCommitedModel = {
    event: "committed";
    committer: GitHubUserModel & {
        date: string;
    };
    author: GitHubUserModel & {
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
    event: "reviewed";
    state: "approved" | "changes_requested" | "commented" | "dismissed" | "pending";
    submitted_at: string;
    user: GitHubUserModel;
};
export type GitHubPullRequestActivityReadyForReviewModel = {
    event: "ready_for_review";
    created_at: string;
    actor: GitHubUserModel;
};


export type GitHubFileModel = {
    filename: string;
    changes: number;
};
export type GitHubUserModel = {
    login: string;
};
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
    isReadyForReviewEvent(event: GitHubPullRequestActivityModel): event is GitHubPullRequestActivityReadyForReviewModel {
        return event.event === "ready_for_review";
    },
    isReviewedEvent(event: GitHubPullRequestActivityModel): event is GitHubPullRequestActivityReviewedModel {
        return event.event === "reviewed";
    }
};