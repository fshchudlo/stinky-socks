import { BitbucketProjectSettings } from "./bitbucket/BitbucketPullRequestsImporter";
import { BitbucketAPI } from "./bitbucket/api/BitbucketAPI";

export const appImportConfig = {
    teams: [{
        teamName: "Test Team",
        bitbucketProjects: [{
            projectKey: "TEST",
            botUserNames: ["bot.user"],
            formerEmployeeNames: ["former.employee"],
            repositoriesSelector: async (api: BitbucketAPI) => (await api.getProjectRepositories("TEST")).filter(r => !r.slug.startsWith("test")).map((r: any) => r.slug)
        } as BitbucketProjectSettings]
    }]
};