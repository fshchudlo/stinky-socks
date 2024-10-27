import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1730055495577 implements MigrationInterface {
    name = 'InitialMigration1730055495577'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "contributor" ("id" SERIAL NOT NULL, "team_name" character varying NOT NULL, "login" character varying NOT NULL, "is_bot_user" boolean NOT NULL DEFAULT false, "is_former_employee" boolean NOT NULL DEFAULT false, "nickname" character varying NOT NULL, CONSTRAINT "UQ_129d57fe9bdad048f34fb1dd486" UNIQUE ("team_name", "login"), CONSTRAINT "UQ_b2e10e7dafc591281aab3bca919" UNIQUE ("team_name", "nickname"), CONSTRAINT "PK_816afef005b8100becacdeb6e58" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "pull_request_participant" ("team_name" character varying NOT NULL, "project_name" character varying NOT NULL, "repository_name" character varying NOT NULL, "pull_request_number" integer NOT NULL, "participant_id_for_primary_key_hack" integer NOT NULL, "first_comment_date" TIMESTAMP, "first_approval_date" TIMESTAMP, "last_comment_date" TIMESTAMP, "last_approval_date" TIMESTAMP, "comments_count" integer NOT NULL, "participant_id" integer, CONSTRAINT "PK_62adf49d0100c117a0d2bf00cb4" PRIMARY KEY ("team_name", "project_name", "repository_name", "pull_request_number", "participant_id_for_primary_key_hack"))`);
        await queryRunner.query(`CREATE TABLE "pull_request" ("team_name" character varying NOT NULL, "project_name" character varying NOT NULL, "repository_name" character varying NOT NULL, "pull_request_number" integer NOT NULL, "view_url" character varying NOT NULL, "target_branch" character varying NOT NULL, "created_date" TIMESTAMP NOT NULL, "updated_date" TIMESTAMP NOT NULL, "shared_for_review_date" TIMESTAMP NOT NULL, "initial_commit_date" TIMESTAMP, "last_commit_date" TIMESTAMP, "merged_date" TIMESTAMP NOT NULL, "reviewers_count" integer NOT NULL, "total_comments_count" integer NOT NULL, "diff_size" numeric NOT NULL, "tests_were_touched" boolean NOT NULL, "author_role" character varying NOT NULL, "integrity_errors" character varying, "author_id" integer, CONSTRAINT "PK_8df0259646c5cc2d774e3b41a15" PRIMARY KEY ("project_name", "repository_name", "pull_request_number"))`);
        await queryRunner.query(`ALTER TABLE "pull_request_participant" ADD CONSTRAINT "FK_2ef327120eb416378efea705952" FOREIGN KEY ("project_name", "repository_name", "pull_request_number") REFERENCES "pull_request"("project_name","repository_name","pull_request_number") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pull_request_participant" ADD CONSTRAINT "FK_cdf29000cd61587757c5299d7c2" FOREIGN KEY ("participant_id") REFERENCES "contributor"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pull_request" ADD CONSTRAINT "FK_585dfebbf914c8d5ea5964d6188" FOREIGN KEY ("author_id") REFERENCES "contributor"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pull_request" DROP CONSTRAINT "FK_585dfebbf914c8d5ea5964d6188"`);
        await queryRunner.query(`ALTER TABLE "pull_request_participant" DROP CONSTRAINT "FK_cdf29000cd61587757c5299d7c2"`);
        await queryRunner.query(`ALTER TABLE "pull_request_participant" DROP CONSTRAINT "FK_2ef327120eb416378efea705952"`);
        await queryRunner.query(`DROP TABLE "pull_request"`);
        await queryRunner.query(`DROP TABLE "pull_request_participant"`);
        await queryRunner.query(`DROP TABLE "contributor"`);
    }

}
