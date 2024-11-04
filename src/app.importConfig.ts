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


const testKaTeam: TeamImportSettings = {
    teamName: "Test KA Team",
    gitHubProjects: [{
        owner: "webpros-licensing",
        auth: {
            apiToken: process.env.GITHUB_API_ENTERPRISE_TOKEN as string
        },
        botUserNames: ["bot-automerge", "gitbot", "codeowners", "lps-integration", "devsensei-auto-merge-service-user"],
        formerEmployeeNames: [
            "victor.kupriyanov",
            "denis.gorbatykh",
            "aleksandr.sapelkin",
            "nrylov",
            "asitkov",
            "kagamian",
            "ddobrotvorskiy",
            "anechaev",
            "andrey.melnikov",
            "vsamsonova",
            "dchagin",
            "ddolovov",
            "alexander.tarankov",
            "nmanuilova",
            "dpyshkin",
            "dinshakov",
            "asviridov",
            "ykolbin",
            "amorozyuk",
            "dogurtsov",
            "oovcharenko",
            "pkalinnikov",
            "anechaev",
            "ikrasner",
            "nsimonov",
            "amakeev"
        ],
        repositoriesSelector: () => Promise.resolve(["service.consent-keeper", "service.eres-service",
            "service.hubspot-synchronizer", "service.key-state-cache",
            "service.on-boarding-trials", "service.payg-telemetry",
            "service.pkp-dispatcher", "service.plesk-sso",
            "service.price", "service.sip-processor",
            "service.support-service", "service.technical-reports",
            "core.key-administrator", "core.partner-central",
            "core.production-environment",
            "qa.auto-tests", "qa.tests-e2e", "devops.lps-infrastructure",
            "devops.lps-jenkins-library"
        ])
    }]
};
