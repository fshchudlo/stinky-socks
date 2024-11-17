import { appImportConfig, TeamImportSettings } from "./app.importConfig";
import { ActorFactory } from "./MetricsDB/ActorFactory";
import { GitHubAPI } from "./GitHub/api/GitHubAPI";
import { GitHubPullRequestsImporter } from "./GitHub/GitHubPullRequestsImporter";

export default async function importTeamProjects() {
    const timelogLabel = `🎉 Teams data import completed!`;
    console.time(timelogLabel);
    console.group("🚀 Starting Pull Requests import...");

    for (const team of appImportConfig.teams) {
        console.log(`🔁 Importing pull requests for the '${team.teamName}' team`);

        await ActorFactory.preloadCacheByTeam(team.teamName);
        await importGitHubPullRequests(team);
    }

    console.groupEnd();
    console.timeEnd(timelogLabel);
}

async function importGitHubPullRequests(team: TeamImportSettings) {
    const timelogLabel = `🎉 GitHub pull requests import completed!`;
    console.time(timelogLabel);

    for (const gitHubProject of team.gitHubProjects || []) {
        console.group(`🔁 Importing pull requests for the '${gitHubProject.owner}' project`);

        const gitHubAPI = new GitHubAPI(gitHubProject.auth.apiToken, true);
        await new GitHubPullRequestsImporter(gitHubAPI, team.teamName, gitHubProject).importPullRequests();

        console.log(`🔁 Import of pull requests for the '${gitHubProject.owner}' project completed`);
        console.groupEnd();
    }
    console.timeEnd(timelogLabel);
}