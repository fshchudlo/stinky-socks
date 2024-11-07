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
        formerParticipantNames: [],
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
        formerParticipantNames: [],
        repositoriesSelector: async () => Promise.resolve(["kubernetes"])
    }]
};

export const appImportConfig = {
    teams: [grafanaTeam, kubernetesTeam]
};
