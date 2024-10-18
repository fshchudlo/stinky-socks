import { MetricsDB } from "./metrics-db/MetricsDB";
import { BitbucketAPI } from "./bitbucket/api/BitbucketAPI";
import { BitbucketPullRequestsImporter } from "./bitbucket/BitbucketPullRequestsImporter";
import { appImportConfig } from "./app.importConfig";

async function runDataImports() {
    await MetricsDB.initialize();
    console.log("🚀 Starting Pull Requests import...");

    console.group();
    for (const team of appImportConfig.teams) {
        console.log(`🔁 Importing pull requests for '${team.teamName}' team`);

        for (const bitbucketProject of team.bitbucketProjects) {
            console.group();
            console.log(`🔁 Importing pull requests for '${bitbucketProject.projectKey}' project`);

            const bitbucketAPI = new BitbucketAPI(bitbucketProject.auth.apiUrl, bitbucketProject.auth.apiToken);
            await new BitbucketPullRequestsImporter(bitbucketAPI, team.teamName, bitbucketProject).importPullRequests();

            console.log(`🔁 Import of pull requests for '${bitbucketProject.projectKey}' project completed`);
            console.groupEnd();
        }
    }
    console.groupEnd();


    console.log("🎉 Pull Requests import completed!");
}

runDataImports().catch(error => console.log(error));
