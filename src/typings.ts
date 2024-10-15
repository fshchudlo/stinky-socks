import { BitbucketAPI } from "./bitbucket/BitbucketAPI";

export type TeamImportSettings = {
    teamName: string;
    formerEmployeesNames: string[];
    projects: TeamProjectSettings[];
}
export type TeamProjectSettings = {
    projectKey: string;
    repositoriesSelector: (api: BitbucketAPI) => Promise<string[]>;
    botUserNames: string[];
}

export type BitbucketPullRequestImportModel = {
    teamName: string;
    botUsers: string[],
    formerEmployees: string[],
    pullRequest: any,
    pullRequestActivities: any[],
    commits: any[],
    diff: any
}