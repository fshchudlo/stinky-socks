import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class InitialMigration1728847106128 implements MigrationInterface {
    name = "InitialMigration1728847106128";

    public async up(queryRunner: QueryRunner): Promise<void> {
        const namingStrategy = queryRunner.connection.namingStrategy;
        await queryRunner.createTable(
            new Table({
                name: namingStrategy.tableName("PullRequest", undefined),
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
                    { name: namingStrategy.columnName("commentsCount", undefined, []), type: "int" },
                    { name: namingStrategy.columnName("diffSize", undefined, []), type: "bigint" },
                    { name: namingStrategy.columnName("testsWereTouched", undefined, []), type: "boolean" }
                ]
            })
        );

        await queryRunner.createTable(
            new Table({
                name: namingStrategy.tableName("PullRequestParticipant", undefined),
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

        await queryRunner.createForeignKey(
            namingStrategy.tableName("PullRequestParticipant", undefined),
            new TableForeignKey({
                columnNames: [namingStrategy.columnName("projectKey", undefined, []), namingStrategy.columnName("repositoryName", undefined, []), namingStrategy.columnName("pullRequestNumber", undefined, [])],
                referencedTableName: namingStrategy.tableName("PullRequest", undefined),
                referencedColumnNames: [namingStrategy.columnName("projectKey", undefined, []), namingStrategy.columnName("repositoryName", undefined, []), namingStrategy.columnName("pullRequestNumber", undefined, [])],
                onDelete: "CASCADE"
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const namingStrategy = queryRunner.connection.namingStrategy;
        // Drop foreign key
        const table = await queryRunner.getTable(namingStrategy.tableName("PullRequestParticipant", undefined));
        const foreignKey = table!.foreignKeys.find(
            (fk) => fk.columnNames.indexOf(namingStrategy.columnName("pullRequestNumber", undefined, [])) !== -1
        );
        if (foreignKey) {
            await queryRunner.dropForeignKey(namingStrategy.tableName("PullRequestParticipant", undefined), foreignKey);
        }

        // Drop tables
        await queryRunner.dropTable(namingStrategy.tableName("PullRequestParticipant", undefined));
        await queryRunner.dropTable(namingStrategy.tableName("PullRequest", undefined));
    }

}
