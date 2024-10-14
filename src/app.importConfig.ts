import { TeamImportSettings } from "./typings";

export const appImportConfig = {
    teams: [{
        teamName: "Test Team",
        formerEmployees: ["former.employee"],
        projects: [{
            projectKey: "TEST",
            repositoriesSelector: () => Promise.resolve(["test"]),
            botUsers: ["bot.user"]
        }]
    } as TeamImportSettings]
};