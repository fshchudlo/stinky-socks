import "reflect-metadata";

import { MetricsDB } from "./MetricsDB/MetricsDB";
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

MetricsDB.initialize().then(() => {
    runDataImports().catch(error => console.error(error));

    setInterval(() => {
        runDataImports().catch(error => console.error(error));
    }, 15 * 60 * 1000); //each 15 minutes
});