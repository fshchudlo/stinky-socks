import "dotenv/config";
import { GitHubProjectSettings } from "./GitHub/GitHubPullRequestsImporter";

export type TeamImportSettings = {
    teamName: string;
    gitHubProjects?: GitHubProjectSettings[]
};

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

const phpTeam: TeamImportSettings = {
    teamName: "PHP",
    gitHubProjects: [{
        owner: "php",
        repositoriesSelector: async () => Promise.resolve(["php-src"])
    }]
};

const clickHouseTeam: TeamImportSettings = {
    teamName: "ClickHouse",
    gitHubProjects: [{
        owner: "ClickHouse",
        repositoriesSelector: async () => Promise.resolve(["ClickHouse"])
    }]
};


const tokens = (process.env.GITHUB_PUBLIC_API_TOKENS as string)?.split(' ')||[];
export const githubPublicProjectsImportConfig = {
    apiTokens: tokens,
    teams: [phpTeam, clickHouseTeam, kubernetesTeam, grafanaTeam, angularTeam, reactTeam]
};
