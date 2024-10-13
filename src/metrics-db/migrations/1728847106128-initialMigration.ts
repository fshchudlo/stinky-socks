import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class InitialMigration1728847106128 implements MigrationInterface {
    name = "InitialMigration1728847106128";

    public async up(queryRunner: QueryRunner): Promise<void> {
        const namingStrategy = queryRunner.connection.namingStrategy;
        await queryRunner.createTable(
            new Table({
                name: "pull_request",
                columns: [
                    { name: namingStrategy.columnName("projectKey", undefined, []), type: "varchar", isPrimary: true },
                    {
                        name: namingStrategy.columnName("repositoryName", undefined, []),
                        type: "varchar",
                        isPrimary: true
                    },
                    {
                        name: namingStrategy.columnName("pullRequestNumber", undefined, []),
                        type: "int",
                        isPrimary: true
                    },
                    { name: namingStrategy.columnName("teamName", undefined, []), type: "varchar" },
                    { name: namingStrategy.columnName("author", undefined, []), type: "varchar" },
                    { name: namingStrategy.columnName("viewURL", undefined, []), type: "varchar" },
                    { name: namingStrategy.columnName("authorIsBotUser", undefined, []), type: "boolean" },
                    { name: namingStrategy.columnName("authorIsFormerEmployee", undefined, []), type: "boolean" },
                    { name: namingStrategy.columnName("targetBranch", undefined, []), type: "varchar" },
                    { name: namingStrategy.columnName("openedDate", undefined, []), type: "timestamp" },
                    {
                        name: namingStrategy.columnName("initialCommitDate", undefined, []),
                        type: "timestamp",
                        isNullable: true
                    },
                    { name: namingStrategy.columnName("lastCommitDate", undefined, []), type: "timestamp" },
                    { name: namingStrategy.columnName("mergedDate", undefined, []), type: "timestamp" },
                    { name: namingStrategy.columnName("reviewersCount", undefined, []), type: "int" },
                    { name: namingStrategy.columnName("approvalsCount", undefined, []), type: "int" },
                    { name: namingStrategy.columnName("participantsCount", undefined, []), type: "int" },
                    { name: namingStrategy.columnName("resolvedTasksCount", undefined, []), type: "int" },
                    { name: namingStrategy.columnName("openTasksCount", undefined, []), type: "int" },
                    { name: namingStrategy.columnName("commentsCount", undefined, []), type: "int" },
                    { name: namingStrategy.columnName("commitsAfterFirstApprovalCount", undefined, []), type: "int" },
                    { name: namingStrategy.columnName("rebasesCount", undefined, []), type: "int" },
                    { name: namingStrategy.columnName("diffSize", undefined, []), type: "bigint" },
                    { name: namingStrategy.columnName("testsWereTouched", undefined, []), type: "boolean" }
                ]
            })
        );

        // Create pull_request_participant table
        await queryRunner.createTable(
            new Table({
                name: "pull_request_participant",
                columns: [
                    {
                        name: namingStrategy.columnName("id", undefined, []),
                        type: "int",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment"
                    },
                    { name: namingStrategy.columnName("projectKey", undefined, []), type: "varchar" },
                    { name: namingStrategy.columnName("repositoryName", undefined, []), type: "varchar" },
                    { name: namingStrategy.columnName("pullRequestNumber", undefined, []), type: "int" },
                    { name: namingStrategy.columnName("participantName", undefined, []), type: "varchar" },
                    {
                        name: namingStrategy.columnName("firstCommentDate", undefined, []),
                        type: "timestamp",
                        isNullable: true
                    },
                    {
                        name: namingStrategy.columnName("firstApprovalDate", undefined, []),
                        type: "timestamp",
                        isNullable: true
                    },
                    {
                        name: namingStrategy.columnName("lastCommentDate", undefined, []),
                        type: "timestamp",
                        isNullable: true
                    },
                    {
                        name: namingStrategy.columnName("lastApprovalDate", undefined, []),
                        type: "timestamp",
                        isNullable: true
                    },
                    { name: namingStrategy.columnName("commentsCount", undefined, []), type: "int" },
                    { name: namingStrategy.columnName("isBotUser", undefined, []), type: "boolean" },
                    { name: namingStrategy.columnName("isFormerEmployee", undefined, []), type: "boolean" }
                ]
            })
        );

        // Add foreign key to pull_request_participant
        await queryRunner.createForeignKey(
            "pull_request_participant",
            new TableForeignKey({
                columnNames: [namingStrategy.columnName("projectKey", undefined, []), namingStrategy.columnName("repositoryName", undefined, []), namingStrategy.columnName("pullRequestNumber", undefined, [])],
                referencedTableName: "pull_request",
                referencedColumnNames: [namingStrategy.columnName("projectKey", undefined, []), namingStrategy.columnName("repositoryName", undefined, []), namingStrategy.columnName("pullRequestNumber", undefined, [])],
                onDelete: "CASCADE"
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key
        const table = await queryRunner.getTable("pull_request_participant");
        const foreignKey = table!.foreignKeys.find(
            (fk) => fk.columnNames.indexOf("pull_request_number") !== -1
        );
        if (foreignKey) {
            await queryRunner.dropForeignKey("pull_request_participant", foreignKey);
        }

        // Drop tables
        await queryRunner.dropTable("pull_request_participant");
        await queryRunner.dropTable("pull_request");
    }

}
