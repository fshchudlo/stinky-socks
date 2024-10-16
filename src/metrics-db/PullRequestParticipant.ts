import { Entity, Column, ManyToOne, JoinColumn, PrimaryGeneratedColumn } from "typeorm";
import { PullRequest } from "./PullRequest";

@Entity()
export abstract class PullRequestParticipant {
    @PrimaryGeneratedColumn()
    protected id: number;

    @Column()
    protected projectKey: string;

    @Column()
    protected repositoryName: string;

    @Column()
    protected pullRequestNumber: number;

    @Column()
    protected participantName: string;

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

    @Column()
    protected isBotUser: boolean;

    @Column()
    protected isFormerEmployee: boolean;

    @ManyToOne(() => PullRequest, (pr) => pr.participants)
    // ⚠️ remove snake naming after this bugfix merge: https://github.com/typeorm/typeorm/pull/11062
    @JoinColumn([
        { name: "project_key", referencedColumnName: "projectKey" },
        { name: "repository_name", referencedColumnName: "repositoryName" },
        { name: "pull_request_number", referencedColumnName: "pullRequestNumber" }
    ])
    pullRequest: PullRequest;
}
  