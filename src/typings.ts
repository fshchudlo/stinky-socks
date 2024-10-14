import { BitbucketAPI } from "./bitbucket/BitbucketAPI";

export type TeamImportSettings = {
    teamName: string;
    formerEmployees: string[];
    projects: TeamProjectSettings[];
}
export type TeamProjectSettings = {
    projectKey: string;
    repositoriesSelector: (api: BitbucketAPI) => Promise<string[]>;
    botUsers: string[];
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