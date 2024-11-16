import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveCommitsHistoryWasRewrittenField1731782438869 implements MigrationInterface {
    name = 'RemoveCommitsHistoryWasRewrittenField1731782438869'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pull_request" DROP COLUMN "commits_history_was_rewritten"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pull_request" ADD "commits_history_was_rewritten" boolean NOT NULL default FALSE`);
    }

}
