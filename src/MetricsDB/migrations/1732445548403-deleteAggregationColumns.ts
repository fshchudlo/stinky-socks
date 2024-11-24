import { MigrationInterface, QueryRunner } from "typeorm";

export class DeleteAggregationColumns1732445548403 implements MigrationInterface {
    name = 'DeleteAggregationColumns1732445548403'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pull_request" ADD "author_comments_count" integer NOT NULL`);

        await queryRunner.query(`ALTER TABLE "pull_request" DROP COLUMN "first_reaction_date"`);
        await queryRunner.query(`ALTER TABLE "pull_request" DROP COLUMN "last_approval_date"`);
        await queryRunner.query(`ALTER TABLE "pull_request" DROP COLUMN "rework_completed_date"`);
        await queryRunner.query(`ALTER TABLE "pull_request" DROP COLUMN "total_comments_count"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pull_request" DROP COLUMN "author_comments_count"`);

        await queryRunner.query(`ALTER TABLE "pull_request" ADD "rework_completed_date" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "pull_request" ADD "last_approval_date" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "pull_request" ADD "first_reaction_date" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "pull_request" ADD "total_comments_count" integer NOT NULL`);
    }

}
