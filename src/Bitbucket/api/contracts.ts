export type BitbucketPullRequestModel = {
    id: number;
    author: {
        user: BitbucketUserModel;
    };
    toRef: {
        repository: {
            project: {
                key: string;
            };
            slug: string;
        };
        displayId: string;
    };
    links: {
        self: {
            href: string;
        }[];
    };
    reviewers: {
        user: BitbucketUserModel;
    }[];
    participants: {
        user: BitbucketUserModel;
    }[];
    properties?: {
        resolvedTaskCount?: number;
        openTaskCount?: number;
    };
    createdDate: number;
    updatedDate: number;
    closedDate: number;
}
export type BitbucketPullRequestActivityModel = {
    createdDate: number;
    addedReviewers?: BitbucketUserModel[];
    user: BitbucketUserModel;
    action?: string;
    fromHash?: string;
    previousFromHash?: string;
};

export type BitbucketCommitModel = {
    authorTimestamp: number;
    committerTimestamp: number;
};

export type BitbucketDiffModel = {
    diffs: {
        destination: { toString: string; };
        hunks: {
            segments: {
                type: string;
                lines: string[];
            }[];
        }[];
    }[];
};
export type BitbucketUserModel = {
    slug: string;
};