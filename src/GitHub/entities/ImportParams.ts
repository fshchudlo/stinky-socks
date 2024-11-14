import { GitHubFileDiffModel, GitHubPullRequestActivityModel, GitHubPullRequestModel } from "../api/GitHubAPI.contracts";

export type ImportParams = {
    teamName: string;
    botUserNames: string[],
    pullRequest: GitHubPullRequestModel,
    activities: GitHubPullRequestActivityModel[],
    files: GitHubFileDiffModel[]
}