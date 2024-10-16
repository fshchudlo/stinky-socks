import { MetricsDB } from "./metrics-db/MetricsDB";
import { BitbucketAPI } from "./bitbucket/api/BitbucketAPI";
import { AppConfig } from "./app.config";
import { BitbucketPullRequestsImporter } from "./bitbucket/BitbucketPullRequestsImporter";
import { appImportConfig } from "./app.importConfig";

async function runDataImports() {
    await MetricsDB.initialize();
    const bitbucketAPI = new BitbucketAPI(AppConfig.Bitbucket.API_URL, AppConfig.Bitbucket.API_TOKEN);

    console.log("🚀 Starting Pull Requests import...");

    console.group();
    for (const team of appImportConfig.teams) {
        console.log(`🔁 Importing pull requests for '${team.teamName}' team`);
        await new BitbucketPullRequestsImporter(bitbucketAPI, team.teamName, team.bitbucketProjects).importPullRequests();
    }
    console.groupEnd();


    console.log("🎉 Pull Requests import completed!");
}

runDataImports().catch(error => console.log(error));
