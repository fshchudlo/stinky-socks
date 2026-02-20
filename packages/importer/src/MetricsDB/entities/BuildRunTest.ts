import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { BuildRun } from "./BuildRun";

@Entity()
export class BuildRunTest {
    @PrimaryGeneratedColumn()
    syntheticId: number;

    @Column()
    testName: string;

    @Column({ type: "varchar" })
    testStatus: string;

    @Column({ type: "double precision" })
    testDuration: number;

    @Column()
    excludeFromStats: boolean;

    @Column()
    buildRunId: string;

    @ManyToOne(() => BuildRun, (buildRun) => buildRun.tests, { onDelete: "CASCADE", onUpdate: "CASCADE" })
    @JoinColumn([{ name: "build_run_id", referencedColumnName: "buildRunId" }])
    buildRun: BuildRun;
}
