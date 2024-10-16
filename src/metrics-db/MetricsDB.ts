import { DataSource } from "typeorm";
import { AppConfig } from "../app.config";
import { PullRequest } from "./PullRequest";
import { PullRequestParticipant } from "./PullRequestParticipant";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";

export const MetricsDB = new DataSource({
    type: "postgres",
    host: AppConfig.MetricsDB.DB_HOST,
    port: AppConfig.MetricsDB.DB_PORT,
    username: AppConfig.MetricsDB.DB_USERNAME,
    password: AppConfig.MetricsDB.DB_PASSWORD,
    database: AppConfig.MetricsDB.DB_NAME,
    entities: [PullRequest, PullRequestParticipant],
    namingStrategy: new SnakeNamingStrategy(),
    synchronize: false,
    migrations: ["src/metrics-db/migrations/*.ts"],
    migrationsRun: true,
    logging: false
});