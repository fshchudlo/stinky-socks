import {publicProjectsImportConfig, TeamImportSettings} from "./publicProjectsImportConfig";
import {ActorFactory} from "./MetricsDB/ActorFactory";
import {GitHubAPI} from "./GitHub/api/GitHubAPI";
import {GitHubPullRequestsImporter} from "./GitHub/GitHubPullRequestsImporter";
import {AppConfig} from "./app.config";
import {PersonalTokensRotator} from "./GitHub/api/PersonalTokensRotator"; 
import {getAppInstallations, InstallationTokensEmitter} from "./GitHub/api/InstallationTokensEmitter";

export default async function importTeamProjects() {
    const timelogLabel = `🎉 Teams data import completed!`;
    console.time(timelogLabel);
    console.group("🚀 Starting Pull Requests import...");
    await runImportForThePublicProjects();
    await runImportForAppInstallations();

    console.groupEnd();
    console.timeEnd(timelogLabel);
}

async function runImportForAppInstallations() {
    if (!AppConfig.STINKY_SOCKS_GITHUB_APP_ID) {
        console.log(`STINKY_SOCKS_GITHUB_APP_ID is not set. Skipping the organizations import.`);
        return;
    }
    const installations = await getAppInstallations(AppConfig.STINKY_SOCKS_GITHUB_APP_ID!, AppConfig.STINKY_SOCKS_GITHUB_APP_PRIVATE_KEY!);
    for (const installation of installations) {
        console.log(`🔁 Importing pull requests for the '${installation.organizationLogin}' organization`);

        await ActorFactory.preloadCacheByTeam(installation.organizationLogin);

        const appTokensEmitter = new InstallationTokensEmitter(AppConfig.STINKY_SOCKS_GITHUB_APP_ID!,
            AppConfig.STINKY_SOCKS_GITHUB_APP_PRIVATE_KEY!,
            installation.organizationId);
        const githubAPI = new GitHubAPI(appTokensEmitter);


        await importGitHubPullRequests({
            teamName: installation.organizationLogin,
            gitHubProjects: [{
                owner: installation.organizationLogin
            }]
        }, githubAPI);
    }
}

async function runImportForThePublicProjects() {
    for (const team of publicProjectsImportConfig.teams) {
        console.log(`🔁 Importing pull requests for the '${team.teamName}' team`);

        await ActorFactory.preloadCacheByTeam(team.teamName);
        const tokensRotator = new PersonalTokensRotator(publicProjectsImportConfig.gitHubApiTokens);
        const gitHubAPI = new GitHubAPI(tokensRotator);
        for(const {} of publicProjectsImportConfig.gitHubApiTokens)
        {
            await gitHubAPI.triggerTokenRateLimitVerification();
        }
        await importGitHubPullRequests(team, gitHubAPI);
    }
}

async function importGitHubPullRequests(team: TeamImportSettings, gitHubAPI: GitHubAPI) {
    const timelogLabel = `🎉 GitHub pull requests import completed for ${team.teamName}!`;
    console.time(timelogLabel);

    for (const gitHubProject of team.gitHubProjects || []) {
        console.group(`🔁 Importing pull requests for the '${gitHubProject.owner}' project`);

        await new GitHubPullRequestsImporter(gitHubAPI, team.teamName, gitHubProject).importPullRequests();

        console.log(`🔁 Import of pull requests for the '${gitHubProject.owner}' project completed`);
        console.groupEnd();
    }
    console.timeEnd(timelogLabel);
}