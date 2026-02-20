import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { BuildRun } from "./BuildRun";

@Entity()
export class BuildCommit {
    @PrimaryColumn()
    commitId: string;

    @PrimaryColumn()
    buildRunId: string;

    @Column({ type: "timestamp" })
    commitDate: Date;

    @Column()
    authorEmail: string;

    @ManyToOne(() => BuildRun, (buildRun) => buildRun.commits, { onDelete: "CASCADE", onUpdate: "CASCADE" })
    @JoinColumn([{ name: "build_run_id", referencedColumnName: "buildRunId" }])
    buildRun: BuildRun;
}
