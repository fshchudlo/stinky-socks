import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn } from "typeorm";
import { PullRequestParticipant } from "./PullRequestParticipant";
import { Contributor } from "./Contributor";

@Entity()
export abstract class PullRequest {
    @PrimaryColumn()
    protected projectKey: string;

    @PrimaryColumn()
    protected repositoryName: string;

    @PrimaryColumn()
    protected pullRequestNumber: number;

    @Column()
    protected teamName: string;

    @Column()
    protected viewURL: string;

    @Column()
    protected targetBranch: string;

    @Column()
    protected openedDate: Date;

    @Column({ nullable: true })
    protected initialCommitDate?: Date;

    @Column()
    protected lastCommitDate: Date;

    @Column()
    protected mergedDate: Date;

    @Column()
    protected reviewersCount: number;

    @Column()
    protected commentsCount: number;

    @Column({ type: "numeric" })
    protected diffSize: number;

    @Column()
    protected testsWereTouched: boolean;

    @Column({ type: "varchar" })
    protected authorRole: "COLLABORATOR" | "CONTRIBUTOR" | "NONE";

    @OneToMany(() => PullRequestParticipant, (participant) => participant.pullRequest, {
        cascade: true
    })
    participants: PullRequestParticipant[];

    @ManyToOne(() => Contributor, (author) => author.pullRequests, { onDelete: "CASCADE" })
    @JoinColumn()
    author: Contributor;
}
