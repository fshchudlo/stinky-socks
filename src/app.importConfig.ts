import { TeamImportSettings } from "./typings";
import { BitbucketAPI } from "./bitbucket/BitbucketAPI";

export const appImportConfig = {
    teams: [{
        teamName: "Test Team",
        formerEmployeesNames: ["former.employee"],
        projects: [{
            projectKey: "TEST",
            botUserNames: ["bot.user"],
            repositoriesSelector: async (api: BitbucketAPI) => (await api.getProjectRepositories("TEST")).filter(r => !r.slug.startsWith("test")).map((r: any) => r.slug)
        }]
    } as TeamImportSettings]
};