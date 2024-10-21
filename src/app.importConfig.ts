import "dotenv/config";
import { BitbucketProjectSettings } from "./Bitbucket/BitbucketPullRequestsImporter";
import { GitHubProjectSettings } from "./GitHub/GitHubPullRequestsImporter";
import { GitHubPullRequestModel } from "./GitHub/api/GitHubAPI.contracts";
import { BitbucketPullRequestModel } from "./Bitbucket/api/BitbucketAPI.contracts";

export type TeamImportSettings = {
    teamName: string;
    bitbucketProjects: BitbucketProjectSettings[];
    gitHubProjects: GitHubProjectSettings[]
};

import { BitbucketAPI } from './Bitbucket/api/BitbucketAPI';
import { GitHubAPI } from './GitHub/api/GitHubAPI';

export const appImportConfig = {
    teams: [{
        teamName: 'Test Team',
        gitHubProjects: [{
            auth: {
                apiToken: process.env.GITHUB_API_TOKEN
            },
            owner: 'TEST',
            botUserNames: ['bot.user'],
            formerEmployeeNames: ['former.employee'],
            repositoriesSelector: async (api: GitHubAPI) => (await api.fetchAllRepositories('TEST')).filter(r => !r.name.startsWith('test')).map(r => r.slug),
            pullRequestsFilterFn: (pr: GitHubPullRequestModel) => new Date(pr.created_at) < new Date('2015-01-01')
        }],
        bitbucketProjects: [{
            auth: {
                apiUrl: process.env.BITBUCKET_API_URL,
                apiToken: process.env.BITBUCKET_API_TOKEN
            },
            projectKey: 'TEST',
            botUserSlugs: ['bot.user'],
            formerEmployeeSlugs: ['former.employee'],
            repositoriesSelector: async (api: BitbucketAPI) => (await api.fetchAllRepositories('TEST')).filter(r => !r.slug.startsWith('test')).map(r => r.slug),
            pullRequestsFilterFn: (pr: BitbucketPullRequestModel) => new Date(pr.createdDate) < new Date('2015-01-01')
        }]
    } as TeamImportSettings]
};

