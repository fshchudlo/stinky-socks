import { DataSource } from "typeorm";
import { AppConfig } from "../app.config";
import { PullRequest } from "./entities/PullRequest";
import { PullRequestParticipant } from "./entities/PullRequestParticipant";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";
import { Actor } from "./entities/Actor";

class MetricsDataSource extends DataSource {
    constructor() {
        super({
            type: "postgres",
            host: AppConfig.MetricsDB.DB_HOST,
            port: AppConfig.MetricsDB.DB_PORT,
            username: AppConfig.MetricsDB.DB_USERNAME,
            password: AppConfig.MetricsDB.DB_PASSWORD,
            database: AppConfig.MetricsDB.DB_NAME,
            entities: [PullRequest, PullRequestParticipant, Actor],
            namingStrategy: new SnakeNamingStrategy(),
            synchronize: false,
            migrations: ["src/MetricsDB/migrations/*.ts"],
            migrationsRun: true,
            logging: false
        });
    }

    async getPRsMaxDate(dateFieldName: "mergedDate" | "updatedDate", teamName: string, projectName: string, repositoryName: string) {
        return (await this.getRepository(PullRequest)
            .createQueryBuilder("pr")
            .select(`MAX(pr.${dateFieldName})`, "maxDate")
            .where("pr.teamName = :teamName", { teamName })
            .andWhere("pr.projectName = :projectName", { projectName })
            .andWhere("pr.repositoryName = :repositoryName", { repositoryName })
            .getRawOne())?.maxDate || null;
    }

    async getPRsCount(teamName: string, projectName: string, repositoryName: string): Promise<number> {
        return (await this.getRepository(PullRequest)
            .createQueryBuilder("pr")
            .select(`COUNT(*)`, "prsCount")
            .where("pr.teamName = :teamName", { teamName })
            .andWhere("pr.projectName = :projectName", { projectName })
            .andWhere("pr.repositoryName = :repositoryName", { repositoryName })
            .getRawOne())?.prsCount;
    }
}

export const MetricsDB = new MetricsDataSource();