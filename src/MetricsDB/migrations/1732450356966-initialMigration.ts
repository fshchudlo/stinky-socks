import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1732450356966 implements MigrationInterface {
    name = 'InitialMigration1732450356966'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "actor" ("id" SERIAL NOT NULL, "team_name" character varying NOT NULL, "login" character varying NOT NULL, "is_bot_user" boolean NOT NULL DEFAULT false, "is_former_participant" boolean NOT NULL DEFAULT false, "nickname" character varying NOT NULL, "team_role" character varying, "merged_with_id" integer, CONSTRAINT "UQ_3d67779088c7355a3465e043cd8" UNIQUE ("team_name", "login"), CONSTRAINT "UQ_5af2dd467558d3c136e5ef82657" UNIQUE ("team_name", "nickname"), CONSTRAINT "PK_05b325494fcc996a44ae6928e5e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "pull_request_participant" ("team_name" character varying NOT NULL, "project_name" character varying NOT NULL, "repository_name" character varying NOT NULL, "pull_request_number" integer NOT NULL, "participant_id_for_primary_key_hack" integer NOT NULL, "first_reaction_date" TIMESTAMP, "first_comment_date" TIMESTAMP, "first_review_date" TIMESTAMP, "first_approval_date" TIMESTAMP, "last_comment_date" TIMESTAMP, "last_review_date" TIMESTAMP, "last_approval_date" TIMESTAMP, "comments_count" integer NOT NULL, "participant_id" integer, CONSTRAINT "PK_62adf49d0100c117a0d2bf00cb4" PRIMARY KEY ("team_name", "project_name", "repository_name", "pull_request_number", "participant_id_for_primary_key_hack"))`);
        await queryRunner.query(`CREATE TABLE "pull_request" ("team_name" character varying NOT NULL, "project_name" character varying NOT NULL, "repository_name" character varying NOT NULL, "pull_request_number" integer NOT NULL, "view_url" character varying NOT NULL, "target_branch" character varying NOT NULL, "created_date" TIMESTAMP NOT NULL, "updated_date" TIMESTAMP NOT NULL, "shared_for_review_date" TIMESTAMP NOT NULL, "initial_commit_date" TIMESTAMP, "last_commit_date" TIMESTAMP, "merged_date" TIMESTAMP NOT NULL, "requested_reviewers_count" integer NOT NULL, "author_comments_count" integer NOT NULL, "diff_rows_added" numeric NOT NULL, "diff_rows_deleted" numeric NOT NULL, "tests_were_touched" boolean NOT NULL, "author_role" character varying NOT NULL, "integrity_errors" character varying, "author_id" integer, CONSTRAINT "PK_c002cc79182e25eb46d9ecddd3a" PRIMARY KEY ("team_name", "project_name", "repository_name", "pull_request_number"))`);
        await queryRunner.query(`ALTER TABLE "actor" ADD CONSTRAINT "FK_263f347676e593db00c5b608e5e" FOREIGN KEY ("merged_with_id") REFERENCES "actor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pull_request_participant" ADD CONSTRAINT "FK_aeb5a331b698d74f94fd3508c49" FOREIGN KEY ("team_name", "project_name", "repository_name", "pull_request_number") REFERENCES "pull_request"("team_name","project_name","repository_name","pull_request_number") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pull_request_participant" ADD CONSTRAINT "FK_cdf29000cd61587757c5299d7c2" FOREIGN KEY ("participant_id") REFERENCES "actor"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pull_request" ADD CONSTRAINT "FK_585dfebbf914c8d5ea5964d6188" FOREIGN KEY ("author_id") REFERENCES "actor"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pull_request" DROP CONSTRAINT "FK_585dfebbf914c8d5ea5964d6188"`);
        await queryRunner.query(`ALTER TABLE "pull_request_participant" DROP CONSTRAINT "FK_cdf29000cd61587757c5299d7c2"`);
        await queryRunner.query(`ALTER TABLE "pull_request_participant" DROP CONSTRAINT "FK_aeb5a331b698d74f94fd3508c49"`);
        await queryRunner.query(`ALTER TABLE "actor" DROP CONSTRAINT "FK_263f347676e593db00c5b608e5e"`);
        await queryRunner.query(`DROP TABLE "pull_request"`);
        await queryRunner.query(`DROP TABLE "pull_request_participant"`);
        await queryRunner.query(`DROP TABLE "actor"`);
    }

}
