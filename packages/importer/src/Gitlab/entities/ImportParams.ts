import {
    GitlabFileDiffModel,
    GitlabProjectModel,
    GitlabPullRequestActivityModel,
    GitlabPullRequestModel
} from "../GitlabAPI.contracts";

export type ImportParams = {
    teamName: string,
    pullRequest: GitlabPullRequestModel,
    repository: GitlabProjectModel,
    activities: GitlabPullRequestActivityModel[],
    files: GitlabFileDiffModel[]
}