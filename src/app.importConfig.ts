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
        repositoriesSelector: async () => Promise.resolve(["vscode"])
    }]
};

export const appImportConfig = {
    teams: [grafanaTeam, kubernetesTeam, vscodeTeam, reactTeam, angularTeam]
};
export type TeamImportSettings = {
    teamName: string;
    gitHubProjects?: GitHubProjectSettings[]
};
