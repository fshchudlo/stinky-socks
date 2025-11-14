import {
    GitlabFileDiffModel,
    GitlabProjectModel,
    GitlabPullRequestActivityModel,
    GitlabPullRequestCommitModel,
    GitlabPullRequestModel
} from "../GitlabAPI.contracts";

export type teamNameResolverFn = (project: GitlabProjectModel, gitlabUserId: number) => string;

export type ImportParams = {
    teamName: string,
    teamNameResolverFn: teamNameResolverFn,
    pullRequest: GitlabPullRequestModel,
    repository: GitlabProjectModel,
    activities: GitlabPullRequestActivityModel[],
    changes: GitlabFileDiffModel[]
    commits: GitlabPullRequestCommitModel[]
}