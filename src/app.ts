import "reflect-metadata";

import { MetricsDB } from "./MetricsDB/MetricsDB";
import { BitbucketAPI } from "./Bitbucket/api/BitbucketAPI";
import { BitbucketPullRequestsImporter } from "./Bitbucket/BitbucketPullRequestsImporter";
import { appImportConfig, TeamImportSettings } from "./app.importConfig";
import { GitHubPullRequestsImporter } from "./GitHub/GitHubPullRequestsImporter";
import { GitHubAPI } from "./GitHub/api/GitHubAPI";

async function runDataImports() {
    await MetricsDB.initialize();
    console.group("🚀 Starting Pull Requests import...");
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
        console.group(`🔁 Importing pull requests for '${bitbucketProject.projectKey}' project`);

        const bitbucketAPI = new BitbucketAPI(bitbucketProject.auth.apiUrl, bitbucketProject.auth.apiToken);
        await new BitbucketPullRequestsImporter(bitbucketAPI, team.teamName, bitbucketProject).importPullRequests();

        console.log(`🔁 Import of pull requests for '${bitbucketProject.projectKey}' project completed`);
        console.groupEnd();
    }
}

async function importGitHubPullRequests(team: TeamImportSettings) {
    for (const gitHubProject of team.gitHubProjects) {
        console.group(`🔁 Importing pull requests for '${gitHubProject.owner}' project`);

        const gitHubAPI = new GitHubAPI(gitHubProject.auth.apiToken);
        await new GitHubPullRequestsImporter(gitHubAPI, team.teamName, gitHubProject).importPullRequests();

        console.log(`🔁 Import of pull requests for '${gitHubProject.owner}' project completed`);
        console.groupEnd();
    }
}

runDataImports().catch(error => console.log(error));
