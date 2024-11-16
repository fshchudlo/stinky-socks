import "dotenv/config";
import { BitbucketProjectSettings } from "./Bitbucket/BitbucketPullRequestsImporter";
import { GitHubProjectSettings } from "./GitHub/GitHubPullRequestsImporter";

export type TeamImportSettings = {
    teamName: string;
    bitbucketProjects?: BitbucketProjectSettings[];
    gitHubProjects?: GitHubProjectSettings[]
};

const grafanaTeam: TeamImportSettings = {
    teamName: "Grafana",
    gitHubProjects: [{
        auth: {
            apiToken: process.env.GITHUB_API_TOKEN as string
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
            apiToken: process.env.GITHUB_API_TOKEN as string
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
            apiToken: process.env.GITHUB_API_TOKEN as string
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
            apiToken: process.env.GITHUB_API_TOKEN as string
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
            apiToken: process.env.GITHUB_API_TOKEN as string
        },
        owner: "microsoft",
        botUserNames: [],
        repositoriesSelector: async () => Promise.resolve(["vscode"])
    }]
};


export const appImportConfig = {
    teams: [vscodeTeam, reactTeam, angularTeam, kubernetesTeam, grafanaTeam]
};
