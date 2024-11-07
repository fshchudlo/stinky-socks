import {
    BitbucketCommitModel,
    BitbucketDiffModel,
    BitbucketPullRequestActivityModel,
    BitbucketPullRequestModel
} from "../api/BitbucketAPI.contracts";

export type ImportParams = {
    teamName: string;
    botUserSlugs: string[],
    formerParticipantSlugs: string[],
    pullRequest: BitbucketPullRequestModel,
    pullRequestActivities: BitbucketPullRequestActivityModel[],
    commits: BitbucketCommitModel[],
    diff: BitbucketDiffModel
}