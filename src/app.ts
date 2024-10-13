import { DataSource } from "typeorm";
import { AppConfig } from "./app.config";
import { PullRequest } from "./MetricsDB/PullRequest";
import { PullRequestParticipant } from "./MetricsDB/PullRequestParticipant";
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

const AppDataSource = new DataSource({
    type: "postgres",
    host: AppConfig.MetricsDB.DB_HOST,
    port: AppConfig.MetricsDB.DB_PORT,
    username: AppConfig.MetricsDB.DB_USERNAME,
    password: AppConfig.MetricsDB.DB_PASSWORD,
    database: AppConfig.MetricsDB.DB_NAME,
    entities: [PullRequest, PullRequestParticipant],
    namingStrategy: new SnakeNamingStrategy(),
    synchronize: true,
    logging: false,
});

async function runDataImports() {
    console.log("Hello world!");
}

AppDataSource.initialize()
    .then(runDataImports)
    .catch(error => console.log(error));
