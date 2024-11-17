import { GitHubFileDiffModel, GitHubPullRequestActivityModel, GitHubPullRequestModel } from "../GitHubAPI.contracts";

export type ImportParams = {
    teamName: string;
    botUserNames: string[],
    pullRequest: GitHubPullRequestModel,
    activities: GitHubPullRequestActivityModel[],
    files: GitHubFileDiffModel[]
}