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

const databricksTeam: TeamImportSettings = {
    teamName: "Databricks",
    gitHubProjects: [{
        owner: "databricks",
        repositoriesSelector: async () => Promise.resolve(["terraform-provider-databricks", "dbt-databricks", "koalas", "cli", "databricks-sdk-go", "databricks-sdk-py", "databricks-sdk-java"])
    }]
};


const tokens = (process.env.GITHUB_PUBLIC_API_TOKENS as string)?.split(' ')||[];
export const publicProjectsImportConfig = {
    gitHubApiTokens: tokens,
    teams: [phpTeam, databricksTeam, kubernetesTeam, grafanaTeam, angularTeam, reactTeam]
};
