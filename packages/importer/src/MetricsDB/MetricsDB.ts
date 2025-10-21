import { DataSource } from "typeorm";
import { AppConfig } from "../app.config";
import { PullRequest } from "./entities/PullRequest";
import { PullRequestParticipant } from "./entities/PullRequestParticipant";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";
import { Actor } from "./entities/Actor";
import { PullRequestActivity } from "./entities/PullRequestActivity";

class MetricsDataSource extends DataSource {
    constructor() {
        super({
            type: "postgres",
            host: AppConfig.MetricsDB.DB_HOST,
            port: AppConfig.MetricsDB.DB_PORT,
            username: AppConfig.MetricsDB.DB_USERNAME,
            password: AppConfig.MetricsDB.DB_PASSWORD,
            database: AppConfig.MetricsDB.DB_NAME,
            entities: [PullRequest, PullRequestParticipant, Actor, PullRequestActivity],
            namingStrategy: new SnakeNamingStrategy(),
            synchronize: false,
            migrations: ["src/MetricsDB/migrations/*.ts"],
            migrationsRun: true,
            logging: !AppConfig.IS_PRODUCTION
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

    async getPRsCount(projectName: string, repositoryName: string, teamName: string | null): Promise<number> {
        let query = this.getRepository(PullRequest)
            .createQueryBuilder("pr")
            .select(`COUNT(*)`, "prsCount")
            .where("pr.projectName = :projectName", { projectName })
            .andWhere("pr.repositoryName = :repositoryName", { repositoryName });

        query = teamName ? query.andWhere("pr.teamName = :teamName", { teamName }) : query;

        return (await query.getRawOne())?.prsCount;
    }
}

export const MetricsDB = new MetricsDataSource();