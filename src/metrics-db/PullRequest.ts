import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
import { PullRequestParticipant } from "./PullRequestParticipant";

@Entity()
export class PullRequest {
    @PrimaryColumn()
    protected projectKey: string;

    @PrimaryColumn()
    protected repositoryName: string;

    @PrimaryColumn()
    protected pullRequestNumber: number;

    @Column()
    protected teamName: string;

    @Column()
    protected author: string;

    @Column()
    protected viewURL: string;

    @Column()
    protected authorIsBotUser: boolean;

    @Column()
    protected authorIsFormerEmployee: boolean;

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

    @Column()
    protected rebasesCount: number;

    @Column()
    protected diffSize: number;

    @Column()
    protected testsWereTouched: boolean;

    @OneToMany(() => PullRequestParticipant, (participant) => participant.pullRequest, {
        cascade: true
    })
    participants: PullRequestParticipant[];
}
