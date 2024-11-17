import "dotenv/config";
import { GitHubProjectSettings } from "./GitHub/GitHubPullRequestsImporter";

const GITHUB_API_TOKEN = process.env.GITHUB_API_TOKEN as string;

const grafanaTeam: TeamImportSettings = {
    teamName: "Grafana",
    gitHubProjects: [{
        auth: {
            apiToken: GITHUB_API_TOKEN
        },
        owner: "grafana",
        botUserNames: [],
        repositoriesSelector: async () => Promise.resolve(["grafana"])
    }]
};

const kubernetesTeam: TeamImportSettings = {
    teamName: "Kubernetes",
    gitHubProjects: [{
        auth: {
            apiToken: GITHUB_API_TOKEN
        },
        owner: "kubernetes",
        botUserNames: [],
        repositoriesSelector: async () => Promise.resolve(["kubernetes"])
    }]
};

const angularTeam: TeamImportSettings = {
    teamName: "Angular",
    gitHubProjects: [{
        auth: {
            apiToken: GITHUB_API_TOKEN
        },
        owner: "angular",
        botUserNames: [],
        repositoriesSelector: async () => Promise.resolve(["angular"])
    }]
};

const reactTeam: TeamImportSettings = {
    teamName: "React",
    gitHubProjects: [{
        auth: {
            apiToken: GITHUB_API_TOKEN
        },
        owner: "facebook",
        botUserNames: [],
        repositoriesSelector: async () => Promise.resolve(["react"])
    }]
};

const vscodeTeam: TeamImportSettings = {
    teamName: "VS Code",
    gitHubProjects: [{
        auth: {
            apiToken: GITHUB_API_TOKEN
        },
        owner: "microsoft",
        botUserNames: [],
        repositoriesSelector: async () => Promise.resolve(["vscode"])
    }]
};


export const appImportConfig = {
    teams: [vscodeTeam, reactTeam, angularTeam, kubernetesTeam, grafanaTeam]
};
export type TeamImportSettings = {
    teamName: string;
    gitHubProjects?: GitHubProjectSettings[]
};
