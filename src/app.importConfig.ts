import { BitbucketProjectSettings } from "./bitbucket/BitbucketPullRequestsImporter";
import { BitbucketAPI } from "./bitbucket/api/BitbucketAPI";

export const appImportConfig = {
    teams: [{
        teamName: "Test Team",
        bitbucketProjects: [{
            auth: {
                apiUrl: process.env.BITBUCKET_API_URL,
                apiToken: process.env.BITBUCKET_API_TOKEN
            },
            projectKey: "TEST",
            botUserNames: ["bot.user"],
            formerEmployeeNames: ["former.employee"],
            repositoriesSelector: async (api: BitbucketAPI) => (await api.fetchAllRepositories("TEST")).filter(r => !r.slug.startsWith("test")).map((r: any) => r.slug),
            pullRequestsFilterFn: (pr: any) => pr.openedDate < new Date("2015-01-01")
        } as BitbucketProjectSettings]
    }]
};