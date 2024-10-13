import { AppDataSource } from "./app.datasource";


async function runDataImports() {
    console.log("🚀 Hello world!");
}

AppDataSource.initialize()
    .then(async () => {
        console.log('🔄 Data Source has been initialized!');
        await runDataImports();
    })
    .catch(error => console.log(error));
