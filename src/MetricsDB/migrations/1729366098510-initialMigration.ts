import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1729366098510 implements MigrationInterface {
    name = 'InitialMigration1729366098510'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "contributor" ("id" SERIAL NOT NULL, "team_name" character varying NOT NULL, "login" character varying NOT NULL, "is_bot_user" boolean NOT NULL DEFAULT false, "is_former_employee" boolean NOT NULL DEFAULT false, "nickname" character varying NOT NULL, CONSTRAINT "UQ_129d57fe9bdad048f34fb1dd486" UNIQUE ("team_name", "login"), CONSTRAINT "UQ_bb42dd28d17f69f5db19b20b2c7" UNIQUE ("nickname"), CONSTRAINT "PK_816afef005b8100becacdeb6e58" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "pull_request_participant" ("id" SERIAL NOT NULL, "team_name" character varying NOT NULL, "project_key" character varying NOT NULL, "repository_name" character varying NOT NULL, "pull_request_number" integer NOT NULL, "participant_name" character varying NOT NULL, "first_comment_date" TIMESTAMP, "first_approval_date" TIMESTAMP, "last_comment_date" TIMESTAMP, "last_approval_date" TIMESTAMP, "comments_count" integer NOT NULL, "is_bot_user" boolean NOT NULL, "is_former_employee" boolean NOT NULL, "participant_id" integer, CONSTRAINT "PK_32d4c0304fa715c4955daef75e4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "pull_request" ("project_key" character varying NOT NULL, "repository_name" character varying NOT NULL, "pull_request_number" integer NOT NULL, "team_name" character varying NOT NULL, "author" character varying NOT NULL, "view_url" character varying NOT NULL, "author_is_bot_user" boolean NOT NULL, "author_is_former_employee" boolean NOT NULL, "target_branch" character varying NOT NULL, "opened_date" TIMESTAMP NOT NULL, "initial_commit_date" TIMESTAMP, "last_commit_date" TIMESTAMP NOT NULL, "merged_date" TIMESTAMP NOT NULL, "reviewers_count" integer NOT NULL, "comments_count" integer NOT NULL, "diff_size" integer NOT NULL, "tests_were_touched" boolean NOT NULL, "author_id" integer, CONSTRAINT "PK_288f4d157b3772d8182d539a8d3" PRIMARY KEY ("project_key", "repository_name", "pull_request_number"))`);
        await queryRunner.query(`ALTER TABLE "pull_request_participant" ADD CONSTRAINT "FK_82d051bf9e5e05287faa1192857" FOREIGN KEY ("project_key", "repository_name", "pull_request_number") REFERENCES "pull_request"("project_key","repository_name","pull_request_number") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pull_request_participant" ADD CONSTRAINT "FK_cdf29000cd61587757c5299d7c2" FOREIGN KEY ("participant_id") REFERENCES "contributor"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pull_request" ADD CONSTRAINT "FK_585dfebbf914c8d5ea5964d6188" FOREIGN KEY ("author_id") REFERENCES "contributor"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pull_request" DROP CONSTRAINT "FK_585dfebbf914c8d5ea5964d6188"`);
        await queryRunner.query(`ALTER TABLE "pull_request_participant" DROP CONSTRAINT "FK_cdf29000cd61587757c5299d7c2"`);
        await queryRunner.query(`ALTER TABLE "pull_request_participant" DROP CONSTRAINT "FK_82d051bf9e5e05287faa1192857"`);
        await queryRunner.query(`DROP TABLE "pull_request"`);
        await queryRunner.query(`DROP TABLE "pull_request_participant"`);
        await queryRunner.query(`DROP TABLE "contributor"`);
    }

}
