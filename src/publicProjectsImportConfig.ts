import "dotenv/config";
import { GitHubProjectSettings } from "./GitHub/GitHubPullRequestsImporter";

const grafanaTeam: TeamImportSettings = {
    teamName: "Grafana",
    gitHubProjects: [{
        owner: "grafana",
        repositoriesSelector: async () => Promise.resolve(["grafana"])
    }]
};

const kubernetesTeam: TeamImportSettings = {
    teamName: "Kubernetes",
    gitHubProjects: [{
        owner: "kubernetes",
        repositoriesSelector: async () => Promise.resolve(["kubernetes"])
    }]
};

const angularTeam: TeamImportSettings = {
    teamName: "Angular",
    gitHubProjects: [{
        owner: "angular",
        repositoriesSelector: async () => Promise.resolve(["angular"])
    }]
};

const reactTeam: TeamImportSettings = {
    teamName: "React",
    gitHubProjects: [{
        owner: "facebook",
        repositoriesSelector: async () => Promise.resolve(["react"])
    }]
};

const vscodeTeam: TeamImportSettings = {
    teamName: "VS Code",
    gitHubProjects: [{
        owner: "microsoft",
        repositoriesSelector: async () => Promise.resolve(["vscode"])
    }]
};

export const publicProjectsImportConfig = {
    gitHubApiToken: process.env.GITHUB_PUBLIC_API_TOKEN as string,
    teams: [grafanaTeam, kubernetesTeam, vscodeTeam, angularTeam, reactTeam]
};
export type TeamImportSettings = {
    teamName: string;
    gitHubProjects?: GitHubProjectSettings[]
};
