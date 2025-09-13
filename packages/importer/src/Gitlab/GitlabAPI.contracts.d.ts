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

export type  GitlabPullRequestActivityModel = {
    type: "DiscussionNote";
    author: GitlabUserModel;
    body: string;

    created_at: string;
    system: boolean;

    resolved_by?: GitlabUserModel;
};

export type  GitlabFileDiffModel = {
    garbage: any;
};

export type  GitlabUserModel = {
    id: number;
    bot: boolean;
    username: string;
};