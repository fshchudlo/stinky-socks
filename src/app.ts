import "reflect-metadata";

import { MetricsDB } from "./metrics-db/MetricsDB";
import { BitbucketAPI } from "./bitbucket/api/BitbucketAPI";
import { BitbucketPullRequestsImporter } from "./bitbucket/BitbucketPullRequestsImporter";
import { appImportConfig, TeamImportSettings } from "./app.importConfig";
import { GitHubPullRequestsImporter } from "./github/GitHubPullRequestsImporter";
import { GitHubAPI } from "./github/api/GitHubAPI";

async function runDataImports() {
    await MetricsDB.initialize();
    console.log("🚀 Starting Pull Requests import...");

    console.group();
    for (const team of appImportConfig.teams) {
        console.log(`🔁 Importing pull requests for '${team.teamName}' team`);

        await importBitbucketProjects(team);

        await importGitHubPullRequests(team);
    }
    console.groupEnd();


    console.log("🎉 Pull Requests import completed!");
}

async function importBitbucketProjects(team: TeamImportSettings) {
    for (const bitbucketProject of team.bitbucketProjects) {
        console.group();
        console.log(`🔁 Importing pull requests for '${bitbucketProject.projectKey}' project`);

        const bitbucketAPI = new BitbucketAPI(bitbucketProject.auth.apiUrl, bitbucketProject.auth.apiToken);
        await new BitbucketPullRequestsImporter(bitbucketAPI, team.teamName, bitbucketProject).importPullRequests();

        console.log(`🔁 Import of pull requests for '${bitbucketProject.projectKey}' project completed`);
        console.groupEnd();
    }
}

async function importGitHubPullRequests(team: TeamImportSettings) {
    for (const gitHubProject of team.gitHubProjects) {
        console.group();
        console.log(`🔁 Importing pull requests for '${gitHubProject.projectKey}' project`);

        const gitHubAPI = new GitHubAPI(gitHubProject.auth.apiToken);
        await new GitHubPullRequestsImporter(gitHubAPI, team.teamName, gitHubProject).importPullRequests();

        console.log(`🔁 Import of pull requests for '${gitHubProject.projectKey}' project completed`);
        console.groupEnd();
    }
}

runDataImports().catch(error => console.log(error));
