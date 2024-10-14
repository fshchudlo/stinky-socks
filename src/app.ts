import { MetricsDB } from "./metricsDB";
import { BitbucketAPI } from "./bitbucket/BitbucketAPI";
import { AppConfig } from "./app.config";
import { PullRequestsImporter } from "./PullRequestsImporter";
import { appImportConfig } from "./app.importConfig";

async function runDataImports() {
    await MetricsDB.initialize();
    const bitbucketAPI = new BitbucketAPI(AppConfig.Bitbucket.API_URL, AppConfig.Bitbucket.API_TOKEN);

    console.log("🚀 Starting Pull Requests import...");
    await new PullRequestsImporter(bitbucketAPI, appImportConfig.teams).importPullRequests();
    console.log("🎉 Pull Requests import completed!");
}

runDataImports().catch(error => console.log(error));
