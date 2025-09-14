import {
    GitlabFileDiffModel,
    GitlabProjectModel,
    GitlabPullRequestActivityModel,
    GitlabPullRequestCommitModel,
    GitlabPullRequestModel
} from "../GitlabAPI.contracts";

export type ImportParams = {
    teamName: string,
    pullRequest: GitlabPullRequestModel,
    repository: GitlabProjectModel,
    activities: GitlabPullRequestActivityModel[],
    changes: GitlabFileDiffModel[]
    commits: GitlabPullRequestCommitModel[]
}