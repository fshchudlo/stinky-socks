import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn } from "typeorm";
import { PullRequestParticipant } from "./PullRequestParticipant";
import { Contributor } from "./Contributor";

@Entity()
export abstract class PullRequest {
    @Column()
    protected teamName: string;

    @PrimaryColumn()
    protected projectName: string;

    @PrimaryColumn()
    protected repositoryName: string;

    @PrimaryColumn()
    protected pullRequestNumber: number;

    @Column()
    protected viewURL: string;

    @Column()
    protected targetBranch: string;

    @Column()
    protected createdDate: Date;

    @Column()
    protected updatedDate: Date;

    @Column()
    protected sharedForReviewDate: Date;

    @Column({ nullable: true })
    protected initialCommitDate?: Date;

    @Column()
    protected lastCommitDate: Date;

    @Column()
    protected mergedDate: Date;

    @Column()
    protected reviewersCount: number;

    @Column()
    protected totalCommentsCount: number;

    @Column({ type: "numeric" })
    protected diffSize: number;

    @Column()
    protected testsWereTouched: boolean;

    @Column({ type: "varchar" })
    protected authorRole: PullRequestAuthorRole;

    @OneToMany(() => PullRequestParticipant, (participant) => participant.pullRequest, {
        cascade: true
    })
    participants: PullRequestParticipant[];

    @ManyToOne(() => Contributor, (author) => author.pullRequests, { onDelete: "CASCADE" })
    @JoinColumn()
    author: Contributor;
}

export type PullRequestAuthorRole =
// The author is the owner of the repository.
    "OWNER"
    // The author is a member of the organization that owns the repository.
    | "MEMBER"
    // The author has write access to the repository.
    | "COLLABORATOR"
    // The author created his first contribution to any repository in the organization.
    | "FIRST_TIMER"
    // The author contributed to this particular repository for the first time.
    | "FIRST_TIME_CONTRIBUTOR"
    // The author has previously committed to the repository but is not necessarily a member or collaborator.
    | "CONTRIBUTOR"
    // The author is a placeholder for a previously deleted user
    | "MANNEQUIN"
    // The author has no affiliation with the repository.
    | "NONE";