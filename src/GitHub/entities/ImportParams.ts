import { GitHubFileDiffModel, GitHubPullRequestActivityModel, GitHubPullRequestModel } from "../api/GitHubAPI.contracts";

export type ImportParams = {
    teamName: string;
    botUserNames: string[],
    formerParticipantNames: string[],
    pullRequest: GitHubPullRequestModel,
    pullRequestActivities: GitHubPullRequestActivityModel[],
    files: GitHubFileDiffModel[]
}