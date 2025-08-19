import "reflect-metadata";
import "./metrics";

import {MetricsDB} from "./MetricsDB/MetricsDB";
import importTeamProjects from "./importTeamProjects";

let isImportRunning = false;

async function runDataImports() {
    if (isImportRunning) {
        console.warn("⚠️ Previous import is still running. Skipping this execution.");
        return;
    }
    try {
        isImportRunning = true;
        console.log(`🚀 Starting the import!`);
        await importTeamProjects();
    } finally {
        isImportRunning = false;
    }
}

function logErrorAndExit(error: any) {
    console.error(error);
    // I wasn't able to understand why, but an app degradates with "socket hang up" and is not able to run after that.
    // For such cases we crash-and-restart a container, but only after a minute to avoid ddos-ing GitHub API 
    setTimeout(() => {
        console.error("Exiting due to error:", error);
        process.exit(1);
    }, 60 * 1000);
}

MetricsDB.initialize().then(() => {
    runDataImports().catch(logErrorAndExit);

    setInterval(() => {
        runDataImports().catch(logErrorAndExit);
    }, 60 * 60 * 1000); //each 60 minutes
});