import { githubPublicProjectsImportConfig, TeamImportSettings } from "./githubPublicProjectsImportConfig";
import { ActorFactory } from "./MetricsDB/ActorFactory";
import { GitHubAPI } from "./GitHub/api/GitHubAPI";
import { GitHubPullRequestsImporter } from "./GitHub/GitHubPullRequestsImporter";
import { AppConfig } from "./app.config";
import { PersonalTokensRotator } from "./GitHub/api/PersonalTokensRotator";
import { getAppInstallations, InstallationTokensEmitter } from "./GitHub/api/InstallationTokensEmitter";
import { gitlabProjectsImportConfig } from "./gitlabProjectsImportConfig";
import { GitlabAPI } from "./Gitlab/api/GitlabAPI";
import { GitlabPullRequestsImporter } from "./Gitlab/GitlabPullRequestsImporter";

export default async function importTeamProjects() {
    const timelogLabel = `🎉 Teams data import completed!`;
    console.time(timelogLabel);
    console.group("🚀 Starting Pull Requests import...");
    await importGitlabProjects();
    await importGithubPublicProjects();
    await importGithubAppInstallationProjects();

    console.groupEnd();
    console.timeEnd(timelogLabel);
}

async function importGithubAppInstallationProjects() {
    if (!AppConfig.STINKY_SOCKS_GITHUB_APP_ID) {
        console.log(`STINKY_SOCKS_GITHUB_APP_ID is not set. Skipping the organizations import.`);
        return;
    }
    const installations = await getAppInstallations(AppConfig.STINKY_SOCKS_GITHUB_APP_ID!, AppConfig.STINKY_SOCKS_GITHUB_APP_PRIVATE_KEY!);
    for (const installation of installations) {
        console.log(`🔁 Importing Github pull requests for the '${installation.organizationLogin}' organization`);

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

async function importGithubPublicProjects() {
    if (githubPublicProjectsImportConfig.apiTokens.length==0) {
        console.log(`None of the GitHub API tokens specified. Skipping the import.`);
        return;
    }
    for (const team of githubPublicProjectsImportConfig.teams) {
        console.log(`🔁 Importing Github pull requests for the '${team.teamName}' team`);

        await ActorFactory.preloadCacheByTeam(team.teamName);
        const tokensRotator = new PersonalTokensRotator(githubPublicProjectsImportConfig.apiTokens);
        const gitHubAPI = new GitHubAPI(tokensRotator);
        for (const {} of githubPublicProjectsImportConfig.apiTokens) {
            await gitHubAPI.triggerTokenRateLimitVerification();
        }
        await importGitHubPullRequests(team, gitHubAPI);
    }
}

async function importGitHubPullRequests(team: TeamImportSettings, gitHubAPI: GitHubAPI) {
    const timelogLabel = `🎉 GitHub pull requests import completed for ${team.teamName}!`;
    console.time(timelogLabel);

    for (const gitHubProject of team.gitHubProjects || []) {
        console.group(`🔁 Importing Github pull requests for the '${gitHubProject.owner}' project`);

        await new GitHubPullRequestsImporter(gitHubAPI, team.teamName, gitHubProject).importPullRequests();

        console.log(`🔁 Import of Github pull requests for the '${gitHubProject.owner}' project completed`);
        console.groupEnd();
    }
    console.timeEnd(timelogLabel);
}


async function importGitlabProjects() {
    console.log(`🔁 Importing Gitlab pull requests`);

    const gitlabAPI = new GitlabAPI(gitlabProjectsImportConfig.url, gitlabProjectsImportConfig.apiToken);
    const timelogLabel = `🎉 Gitlab pull requests import completed!`;
    console.time(timelogLabel);

    const projects = await gitlabAPI.getNamespaces(gitlabProjectsImportConfig.namespaceSearch);

    for (const gitlabProject of projects || []) {
        console.group(`🔁 Importing Gitlab pull requests for the '${gitlabProject.name}' project`);

        await new GitlabPullRequestsImporter(gitlabAPI, gitlabProject, gitlabProjectsImportConfig.resolveTeamName).importPullRequests();

        console.log(`🔁 Import of Gitlab pull requests for the '${gitlabProject.name}' project completed`);
        console.groupEnd();
    }
    console.timeEnd(timelogLabel);
}