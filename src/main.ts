import { DataSource } from "typeorm";
import { AppConfig } from "./app.config";
import { PullRequest } from "./MetricsDB/PullRequest";
import { PullRequestParticipant } from "./MetricsDB/PullRequestParticipant";

const AppDataSource = new DataSource({
    type: "postgres",
    host: AppConfig.MetricsDB.DB_HOST,
    port: AppConfig.MetricsDB.DB_PORT,
    username: AppConfig.MetricsDB.DB_USERNAME,
    password: AppConfig.MetricsDB.DB_PASSWORD,
    database: AppConfig.MetricsDB.DB_NAME,
    entities: [PullRequest, PullRequestParticipant],
    synchronize: true,
    logging: false,
});

async function main() {
    console.log("Hello world!");
}

AppDataSource.initialize()
    .then(main)
    .catch(error => console.log(error));
