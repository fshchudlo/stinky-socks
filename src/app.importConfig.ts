import "dotenv/config";
import { BitbucketProjectSettings } from "./bitbucket/BitbucketPullRequestsImporter";
import { GithubProjectSettings } from "./github/GitHubPullRequestsImporter";
import { BitbucketPullRequestModel } from "./bitbucket/api/BitbucketAPI";

export type TeamImportSettings = {
    teamName: string;
    bitbucketProjects: BitbucketProjectSettings[];
    gitHubProjects: GithubProjectSettings[]
};

import { BitbucketAPI } from "./bitbucket/api/BitbucketAPI";
import { GitHubAPI } from "./github/api/GitHubAPI";

export const appImportConfig = {
    teams: [{
        teamName: "Test Team",
        gitHubProjects: [{
            auth: {
                apiToken: process.env.BITBUCKET_API_TOKEN
            },
            projectKey: "TEST",
            botUserNames: ["bot.user"],
            formerEmployeeNames: ["former.employee"],
            repositoriesSelector: async (api: GitHubAPI) => (await api.fetchAllRepositories("TEST")).filter(r => !r.name.startsWith("test")).map((r: any) => r.slug),
            pullRequestsFilterFn: (pr: any) => pr.openedDate < new Date("2015-01-01")
        }],
        bitbucketProjects: [{
            auth: {
                apiUrl: process.env.BITBUCKET_API_URL,
                apiToken: process.env.BITBUCKET_API_TOKEN
            },
            projectKey: "TEST",
            botUserNames: ["bot.user"],
            formerEmployeeNames: ["former.employee"],
            repositoriesSelector: async (api: BitbucketAPI) => (await api.fetchAllRepositories("TEST")).filter(r => !r.slug.startsWith("test")).map((r: any) => r.slug),
            pullRequestsFilterFn: (pr: BitbucketPullRequestModel) => new Date(pr.createdDate) < new Date("2015-01-01")
        }]
    } as TeamImportSettings]
};


