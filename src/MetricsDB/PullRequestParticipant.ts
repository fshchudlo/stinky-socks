import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn } from "typeorm";
import { PullRequest } from "./PullRequest";
import { Contributor } from "./Contributor";

@Entity()
export abstract class PullRequestParticipant {
    @PrimaryColumn()
    protected teamName: string;

    @PrimaryColumn()
    protected projectName: string;

    @PrimaryColumn()
    protected repositoryName: string;

    @PrimaryColumn()
    protected pullRequestNumber: number;

    @PrimaryColumn()
    //Without this typeorm makes really strange things when doing upsert logic
    protected participantIdForPrimaryKeyHack: number;

    @Column({ nullable: true })
    protected firstCommentDate?: Date;

    @Column({ nullable: true })
    protected firstApprovalDate?: Date;

    @Column({ nullable: true })
    protected lastCommentDate?: Date;

    @Column({ nullable: true })
    protected lastApprovalDate?: Date;

    @Column()
    protected commentsCount: number;

    @ManyToOne(() => PullRequest, (pr) => pr.participants, { onDelete: "CASCADE" })
    // ⚠️ remove snake naming after this bugfix merge: https://github.com/typeorm/typeorm/pull/11062
    @JoinColumn([
        { name: "project_name", referencedColumnName: "projectName" },
        { name: "repository_name", referencedColumnName: "repositoryName" },
        { name: "pull_request_number", referencedColumnName: "pullRequestNumber" }
    ])
    pullRequest: PullRequest;

    @ManyToOne(() => Contributor, (participant) => participant.participations, { onDelete: "CASCADE" })
    @JoinColumn()
    participant: Contributor;
}
  