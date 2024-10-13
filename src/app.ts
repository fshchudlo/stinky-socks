import { AppDataSource } from "./app.datasource";


async function runDataImports() {
    await AppDataSource.initialize();
    console.log("🚀 Hello world!");
}

runDataImports().catch(error => console.log(error));
