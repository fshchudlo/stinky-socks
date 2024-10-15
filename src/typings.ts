import { BitbucketAPI } from "./bitbucket/BitbucketAPI";

export type TeamImportSettings = {
    teamName: string;
    formerEmployeeNames: string[];
    projects: TeamProjectSettings[];
}
export type TeamProjectSettings = {
    projectKey: string;
    repositoriesSelector: (api: BitbucketAPI) => Promise<string[]>;
    botUserNames: string[];
}