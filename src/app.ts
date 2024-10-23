import "reflect-metadata";

import { MetricsDB } from "./MetricsDB/MetricsDB";
import { BitbucketAPI } from "./Bitbucket/api/BitbucketAPI";
import { BitbucketPullRequestsImporter } from "./Bitbucket/BitbucketPullRequestsImporter";
import { appImportConfig, TeamImportSettings } from "./app.importConfig";
import { GitHubPullRequestsImporter } from "./GitHub/GitHubPullRequestsImporter";
import { GitHubAPI } from "./GitHub/api/GitHubAPI";
import { ContributorFactory } from "./MetricsDB/ContributorFactory";

let isImportRunning = false;

async function runDataImports() {
    if (isImportRunning) {
        console.warn("⚠️ Previous import is still running. Skipping this execution.");
        return;
    }
    try {
        isImportRunning = true;
        await importTeamProjects();
    } finally {
        isImportRunning = false;
    }
}

async function importTeamProjects() {
    const timelogLabel = `🎉 Teams data import completed!`;
    console.time(timelogLabel);
    console.group("🚀 Starting Pull Requests import...");

    for (const team of appImportConfig.teams) {
        console.log(`🔁 Importing pull requests for '${team.teamName}' team`);

        await ContributorFactory.preloadCacheByTeam(team.teamName);
        await importBitbucketProjects(team);
        await importGitHubPullRequests(team);
    }

    console.groupEnd();
    console.timeEnd(timelogLabel);
}

async function importBitbucketProjects(team: TeamImportSettings) {
    const timelogLabel = `🎉 Bitbucket pull requests import completed!`;
    console.time(timelogLabel);

    for (const bitbucketProject of team.bitbucketProjects || []) {
        console.group(`🔁 Importing pull requests for '${bitbucketProject.projectKey}' project`);

        const bitbucketAPI = new BitbucketAPI(bitbucketProject.auth.apiUrl, bitbucketProject.auth.apiToken);
        await new BitbucketPullRequestsImporter(bitbucketAPI, team.teamName, bitbucketProject).importPullRequests();

        console.log(`🔁 Import of pull requests for '${bitbucketProject.projectKey}' project completed`);
        console.groupEnd();
    }
    console.timeEnd(timelogLabel);
}

async function importGitHubPullRequests(team: TeamImportSettings) {
    const timelogLabel = `🎉 GitHub pull requests import completed!`;
    console.time(timelogLabel);

    for (const gitHubProject of team.gitHubProjects || []) {
        console.group(`🔁 Importing pull requests for '${gitHubProject.owner}' project`);

        const gitHubAPI = new GitHubAPI(gitHubProject.auth.apiToken, false);
        await new GitHubPullRequestsImporter(gitHubAPI, team.teamName, gitHubProject).importPullRequests();

        console.log(`🔁 Import of pull requests for '${gitHubProject.owner}' project completed`);
        console.groupEnd();
    }
    console.timeEnd(timelogLabel);
}

MetricsDB.initialize().then(() => {
    runDataImports().catch(error => console.error(error));

    setInterval(() => {
        runDataImports().catch(error => console.error(error));
    }, 60 * 60 * 1000); //each hour
});

setInterval(() => {
    const memoryUsage = process.memoryUsage();
    console.log(`🍔 Memory Usage:
        - rss: ${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB,
        - heapTotal: ${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB,
        - heapUsed: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB,
        - external: ${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`);
}, 10 * 1000);