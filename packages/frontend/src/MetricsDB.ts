import { DataSource } from "typeorm";
import { AppConfig } from "./app.config";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";

export const MetricsDB = new DataSource({
    type: "postgres",
    host: AppConfig.MetricsDB.DB_HOST,
    port: AppConfig.MetricsDB.DB_PORT,
    username: AppConfig.MetricsDB.DB_USERNAME,
    password: AppConfig.MetricsDB.DB_PASSWORD,
    database: AppConfig.MetricsDB.DB_NAME,
    namingStrategy: new SnakeNamingStrategy(),
    synchronize: false,
    logging: !AppConfig.IS_PRODUCTION
}); 