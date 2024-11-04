import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn } from "typeorm";
import { PullRequest } from "./PullRequest";
import { Actor } from "./Actor";

@Entity()
export abstract class PullRequestParticipant {
    @PrimaryColumn()
    teamName: string;

    @PrimaryColumn()
    projectName: string;

    @PrimaryColumn()
    repositoryName: string;

    @PrimaryColumn()
    pullRequestNumber: number;

    @PrimaryColumn()
        //Without this typeorm makes really strange things when doing upsert logic
    participantIdForPrimaryKeyHack: number;

    @Column({ nullable: true })
    firstReactionDate?: Date;

    @Column({ nullable: true })
    firstCommentDate?: Date;

    @Column({ nullable: true })
    firstReviewDate?: Date;

    @Column({ nullable: true })
    firstApprovalDate?: Date;

    @Column({ nullable: true })
    lastCommentDate?: Date;

    @Column({ nullable: true })
    lastReviewDate?: Date;

    @Column({ nullable: true })
    lastApprovalDate?: Date;

    @Column()
    commentsCount: number;

    @ManyToOne(() => PullRequest, (pr) => pr.participants, { onDelete: "CASCADE" })
    // ⚠️ remove snake naming after this bugfix merge: https://github.com/typeorm/typeorm/pull/11062
    @JoinColumn([
        { name: "project_name", referencedColumnName: "projectName" },
        { name: "repository_name", referencedColumnName: "repositoryName" },
        { name: "pull_request_number", referencedColumnName: "pullRequestNumber" }
    ])
    pullRequest: PullRequest;

    @ManyToOne(() => Actor, (participant) => participant.participations, { onDelete: "CASCADE" })
    @JoinColumn()
    participant: Actor;

    public calculateAggregations() {
        this.firstReactionDate = [this.firstCommentDate, this.firstReviewDate, this.firstApprovalDate].filter(d => d)
            .map(d => <Date>d)
            .reduce((minDate: Date | null, date) => !minDate || date!.getTime() < (<Date>minDate).getTime() ? date : minDate, null) || undefined;
        return this;
    }
}
  