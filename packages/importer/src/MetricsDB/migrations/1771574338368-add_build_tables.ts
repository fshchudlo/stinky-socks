import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBuildTables1771574338368 implements MigrationInterface {
    name = 'AddBuildTables1771574338368'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "build_commit" ("commit_id" character varying NOT NULL, "build_run_id" character varying NOT NULL, "commit_date" TIMESTAMP NOT NULL, "author_email" character varying NOT NULL, CONSTRAINT "PK_4494f65b76d5737783eadca0bb4" PRIMARY KEY ("commit_id", "build_run_id"))`);
        await queryRunner.query(`CREATE TABLE "build_run_test" ("synthetic_id" SERIAL NOT NULL, "test_name" character varying NOT NULL, "test_status" character varying NOT NULL, "test_duration" double precision NOT NULL, "exclude_from_stats" boolean NOT NULL, "build_run_id" character varying NOT NULL, CONSTRAINT "PK_87abdf43fc084b2c07586812446" PRIMARY KEY ("synthetic_id"))`);
        await queryRunner.query(`CREATE TABLE "build_run" ("build_run_id" character varying NOT NULL, "project_key" character varying NOT NULL, "repository_group" character varying NOT NULL, "repository_name" character varying NOT NULL, "branch_name" character varying NOT NULL, "total_duration_in_seconds" integer, "tests_duration_in_seconds" integer, "wait_duration_in_seconds" integer, "build_number" integer NOT NULL, "build_result" character varying NOT NULL, "build_is_succeeded" boolean NOT NULL, "is_integration_build" boolean NOT NULL, "is_deployment_build" boolean NOT NULL, "is_lead_time_calculation_build" boolean NOT NULL, "is_feature_branch_build" boolean NOT NULL, "triggered_at" TIMESTAMP NOT NULL, "completed_at" TIMESTAMP NOT NULL, CONSTRAINT "PK_116d183ae6e07895643dd81eca7" PRIMARY KEY ("build_run_id"))`);
        await queryRunner.query(`ALTER TABLE "build_commit" ADD CONSTRAINT "FK_ed84868c5b29167d6f59cdcf3bc" FOREIGN KEY ("build_run_id") REFERENCES "build_run"("build_run_id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "build_run_test" ADD CONSTRAINT "FK_bce274499b1a0e8db162354561d" FOREIGN KEY ("build_run_id") REFERENCES "build_run"("build_run_id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "build_run_test" DROP CONSTRAINT "FK_bce274499b1a0e8db162354561d"`);
        await queryRunner.query(`ALTER TABLE "build_commit" DROP CONSTRAINT "FK_ed84868c5b29167d6f59cdcf3bc"`);
        await queryRunner.query(`DROP TABLE "build_run"`);
        await queryRunner.query(`DROP TABLE "build_run_test"`);
        await queryRunner.query(`DROP TABLE "build_commit"`);
    }

}
