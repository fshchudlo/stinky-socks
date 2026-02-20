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
        repositoriesSelector: async () => Promise.resolve(["grafana-foundation-sdk", "grafana"])
    }]
};

const kubernetesTeam: TeamImportSettings = {
    teamName: "Kubernetes",
    gitHubProjects: [{
        owner: "kubernetes",
        repositoriesSelector: async () => Promise.resolve(["kubernetes"])
    }]
};

const clickHouseTeam: TeamImportSettings = {
    teamName: "ClickHouse",
    gitHubProjects: [{
        owner: "ClickHouse",
        repositoriesSelector: async () => Promise.resolve(["ClickHouse"])
    }]
};

const vmTeam: TeamImportSettings = {
    teamName: " VictoriaMetrics",
    gitHubProjects: [{
        owner: "VictoriaMetrics"
    }]
};


const tokens = (process.env.GITHUB_PUBLIC_API_TOKENS as string)?.split(' ')||[];
export const githubPublicProjectsImportConfig = {
    apiTokens: tokens,
    teams: [grafanaTeam, vmTeam, clickHouseTeam, kubernetesTeam]
};
