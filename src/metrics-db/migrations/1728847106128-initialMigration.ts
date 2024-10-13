import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1728847106128 implements MigrationInterface {
    name = 'InitialMigration1728847106128'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "pull_request_participant" ("id" SERIAL NOT NULL, "project_key" character varying NOT NULL, "repository_name" character varying NOT NULL, "pull_request_number" integer NOT NULL, "participant_name" character varying NOT NULL, "first_comment_date" TIMESTAMP, "first_approval_date" TIMESTAMP, "last_comment_date" TIMESTAMP, "last_approval_date" TIMESTAMP, "comments_count" integer NOT NULL, "is_bot_user" boolean NOT NULL, "is_former_employee" boolean NOT NULL, "projectKey" character varying, "repositoryName" character varying, "pullRequestNumber" integer, CONSTRAINT "PK_32d4c0304fa715c4955daef75e4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "pull_request" ("project_key" character varying NOT NULL, "repository_name" character varying NOT NULL, "pull_request_number" integer NOT NULL, "team_name" character varying NOT NULL, "author" character varying NOT NULL, "view_url" character varying NOT NULL, "author_is_bot_user" boolean NOT NULL, "author_is_former_employee" boolean NOT NULL, "target_branch" character varying NOT NULL, "opened_date" TIMESTAMP NOT NULL, "initial_commit_date" TIMESTAMP, "last_commit_date" TIMESTAMP NOT NULL, "merged_date" TIMESTAMP NOT NULL, "reviewers_count" integer NOT NULL, "approvals_count" integer NOT NULL, "participants_count" integer NOT NULL, "resolved_tasks_count" integer NOT NULL, "open_tasks_count" integer NOT NULL, "comments_count" integer NOT NULL, "commits_after_first_approval_count" integer NOT NULL, "rebases_count" integer NOT NULL, "diff_size" integer NOT NULL, "tests_were_touched" boolean NOT NULL, CONSTRAINT "PK_288f4d157b3772d8182d539a8d3" PRIMARY KEY ("project_key", "repository_name", "pull_request_number"))`);
        await queryRunner.query(`ALTER TABLE "pull_request_participant" ADD CONSTRAINT "FK_1b383f5b7c29c8f0a77f40428fe" FOREIGN KEY ("projectKey", "repositoryName", "pullRequestNumber") REFERENCES "pull_request"("project_key","repository_name","pull_request_number") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pull_request_participant" DROP CONSTRAINT "FK_1b383f5b7c29c8f0a77f40428fe"`);
        await queryRunner.query(`DROP TABLE "pull_request"`);
        await queryRunner.query(`DROP TABLE "pull_request_participant"`);
    }

}
