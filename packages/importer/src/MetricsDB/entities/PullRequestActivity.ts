import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn } from "typeorm";
import { PullRequest } from "./PullRequest";

@Entity()
export abstract class PullRequestActivity {
    @PrimaryColumn()
    teamName: string;

    @PrimaryColumn()
    projectName: string;

    @PrimaryColumn()
    repositoryName: string;

    @PrimaryColumn()
    pullRequestNumber: number;

    @Column({ nullable: false })
    who: string;

    @Column({ type: "varchar", nullable: false })
    what: PullRequestActivityType;

    @Column()
    when: Date;

    @Column({ type: "varchar", nullable: true })
    description: string | null;

    @Column({ type: "varchar", nullable: true })
    viewURL: string | null;


    @ManyToOne(() => PullRequest, (pr) => pr.activities, { onDelete: "CASCADE" })
    // ⚠️ remove snake naming after this bugfix merge: https://github.com/typeorm/typeorm/pull/11062
    @JoinColumn([
        { name: "team_name", referencedColumnName: "teamName" },
        { name: "project_name", referencedColumnName: "projectName" },
        { name: "repository_name", referencedColumnName: "repositoryName" },
        { name: "pull_request_number", referencedColumnName: "pullRequestNumber" }
    ])
    pullRequest: PullRequest;
}

export type PullRequestActivityType =
    "ready_for_review"
    | "reviewed"
    | "commented"
    | "committed"
    | "approved"
    | "changes_requested"
    | "dismissed"
    | "pending"
    | "merged";
  