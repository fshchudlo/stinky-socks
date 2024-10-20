import { DataSource } from "typeorm";
import { AppConfig } from "../app.config";
import { PullRequest } from "./PullRequest";
import { PullRequestParticipant } from "./PullRequestParticipant";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";
import { Contributor } from "./Contributor";

class MetricsDataSource extends DataSource {
    constructor() {
        super({
            type: "postgres",
            host: AppConfig.MetricsDB.DB_HOST,
            port: AppConfig.MetricsDB.DB_PORT,
            username: AppConfig.MetricsDB.DB_USERNAME,
            password: AppConfig.MetricsDB.DB_PASSWORD,
            database: AppConfig.MetricsDB.DB_NAME,
            entities: [PullRequest, PullRequestParticipant, Contributor],
            namingStrategy: new SnakeNamingStrategy(),
            synchronize: false,
            migrations: ["src/MetricsDB/migrations/*.ts"],
            migrationsRun: true,
            logging: false
        });
    }

    async getPRsMaxDate(dateFieldName: "mergedDate" | "updatedDate", teamName: string, projectKey: string, repositorySlug: string) {
        return (await this.getRepository(PullRequest)
            .createQueryBuilder("pr")
            .select(`MAX(pr.${dateFieldName})`, "maxDate")
            .where("pr.teamName = :teamName", { teamName: teamName })
            .andWhere("pr.projectKey = :projectKey", { projectKey: projectKey })
            .andWhere("pr.repositoryName = :repositoryName", { repositoryName: repositorySlug })
            .getRawOne())?.maxDate || null;
    }
}

export const MetricsDB = new MetricsDataSource();