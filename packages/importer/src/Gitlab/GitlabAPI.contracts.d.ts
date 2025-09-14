/*
* This is the project in more classic terms
* */
export type GitlabNamespaceModel = {
    id: number;
    name: string;
};

/*
* This is the repository in more classic terms
* */
export type GitlabProjectModel = {
    id: number;
    name: string;
    path_with_namespace: string;
    namespace: {
        name: string
    };
};

export type GitlabPullRequestModel = {
    id: number;
    iid: number;
    target_branch: string;

    author: GitlabUserModel;
    reviewers: GitlabUserModel[];
    assignees: GitlabUserModel[];
    merged_by: GitlabUserModel;

    created_at: string;
    updated_at: string;
    merged_at: string;

    web_url: string;
};

export type GitlabPullRequestActivityModel = GitlabPullRequestGenericActivityModel;

export type  GitlabPullRequestGenericActivityModel = {
    type: "DiscussionNote" | null;
    author: GitlabUserModel;
    body: string;

    created_at: string;
    system: boolean;
};

export type  GitlabPullRequestReviewRequestedActivityModel = {
    type: null;
    author: GitlabUserModel;
    body: string;

    added_reviewers: GitlabUserModel[];
    removed_reviewers: GitlabUserModel[];

    created_at: string;
    system: boolean;
};

export type  GitlabFileDiffModel = {
    new_path: string;
    diff: string;
};

export type  GitlabUserModel = {
    id: number;
    bot: boolean;
    username: string;
};