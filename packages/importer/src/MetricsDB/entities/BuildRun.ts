import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
import { BuildResult } from "./BuildResult";
import { BuildCommit } from "./BuildCommit";
import { BuildRunTest } from "./BuildRunTest";

@Entity()
export class BuildRun {
    @PrimaryColumn()
    buildRunId: string;

    @Column()
    projectKey: string;

    @Column()
    repositoryGroup: string;

    @Column()
    repositoryName: string;

    @Column()
    branchName: string;

    @Column({ type: "integer", nullable: true })
    totalDurationInSeconds: number | null;

    @Column({ type: "integer", nullable: true })
    testsDurationInSeconds: number | null;

    @Column({ type: "integer", nullable: true })
    waitDurationInSeconds: number | null;

    @Column({ type: "integer" })
    buildNumber: number;

    @Column({ type: "varchar" })
    buildResult: BuildResult;

    @Column({ type: "boolean" })
    buildIsSucceeded: boolean;

    @Column({ type: "boolean" })
    isIntegrationBuild: boolean;

    @Column({ type: "boolean" })
    isDeploymentBuild: boolean;

    @Column({ type: "boolean" })
    isLeadTimeCalculationBuild: boolean;

    @Column({ type: "boolean" })
    isFeatureBranchBuild: boolean;

    @Column({ type: "timestamp" })
    triggeredAt: Date;

    @Column({ type: "timestamp" })
    completedAt: Date;

    @OneToMany(() => BuildCommit, (buildCommit) => buildCommit.buildRun, { cascade: true })
    commits: BuildCommit[];

    @OneToMany(() => BuildRunTest, (buildRunTest) => buildRunTest.buildRun, { cascade: true })
    tests: BuildRunTest[];
}
