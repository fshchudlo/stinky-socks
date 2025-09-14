import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn } from "typeorm";
import { PullRequestParticipant } from "./PullRequestParticipant";
import { Actor } from "./Actor";
import { ActorRole } from "./ActorRole";
import { PullRequestActivity } from "./PullRequestActivity";

@Entity()
export abstract class PullRequest {
    @PrimaryColumn()
    teamName: string;

    @PrimaryColumn()
    projectName: string;

    @PrimaryColumn()
    repositoryName: string;

    @PrimaryColumn()
    pullRequestNumber: number;

    @Column()
    viewURL: string;

    @Column()
    targetBranch: string;

    @Column()
    createdDate: Date;

    @Column()
    updatedDate: Date;

    @Column()
    sharedForReviewDate: Date;

    @Column({ nullable: true, type: "timestamp" })
    initialCommitDate: Date | null;

    @Column({ nullable: true, type: "timestamp" })
    lastCommitDate: Date | null;

    @Column()
    mergedDate: Date;

    @Column()
    requestedReviewersCount: number;

    @Column()
    authorCommentsCount: number;

    @Column({ type: "numeric" })
    diffRowsAdded: number;

    @Column({ type: "numeric" })
    diffRowsDeleted: number;

    @Column()
    testsWereTouched: boolean;

    @Column({ type: "varchar" })
    authorRole: ActorRole;

    @Column({ nullable: true, type: "varchar" })
    integrityErrors: string | null;

    @OneToMany(() => PullRequestParticipant, (participant) => participant.pullRequest, {
        cascade: true
    })
    participants: PullRequestParticipant[];

    @OneToMany(() => PullRequestActivity, (activity) => activity.pullRequest, {
        cascade: true
    })
    activities: PullRequestActivity[];

    @ManyToOne(() => Actor, (author) => author.pullRequests, { onDelete: "CASCADE" })
    @JoinColumn()
    author: Actor;


    public calculateAggregations() {
        this.participants.forEach(p => p.calculateAggregations());
        return this;
    }

    public validateDataIntegrity() {
        const errors: string[] = [];

        if (!this.initialCommitDate) {
            errors.push("`initialCommitDate` field is empty. Is that possible that pull request has no commits?");
        }
        if (!this.lastCommitDate) {
            errors.push("`lastCommitDate` field is empty. Is that possible that pull request has no commits?");
        }
        if (this.requestedReviewersCount < 0) {
            errors.push("`requestedReviewersCount` is less than 0. Recheck the import logic on this sample.");
        }

        // createdDate
        if (this.createdDate.getTime() > this.updatedDate.getTime()) {
            errors.push("`createdDate` is bigger than `updatedDate`. Recheck the import logic and timezones handling on this sample.");
        }
        if (this.createdDate.getTime() > this.sharedForReviewDate.getTime()) {
            errors.push("`createdDate` is bigger than `sharedForReviewDate`. Recheck the import logic and timezones handling on this sample.");
        }
        if (this.createdDate.getTime() > this.mergedDate.getTime()) {
            errors.push("`createdDate` is bigger than `mergedDate`. Recheck the import logic and timezones handling on this sample.");
        }
        // updatedDate doesn't have any specific constraints except comparison with createdDate implemented above

        // sharedForReviewDate
        if (this.sharedForReviewDate.getTime() > this.mergedDate.getTime()) {
            errors.push("`sharedForReviewDate` is bigger than `mergedDate`. Recheck the import logic and timezones handling on this sample.");
        }

        // initialCommitDate
        if (this.initialCommitDate && this.lastCommitDate && this.initialCommitDate.getTime() > this.lastCommitDate.getTime()) {
            errors.push("`initialCommitDate` is bigger than `lastCommitDate`. Recheck the import logic and timezones handling on this sample.");
        }
        if (this.initialCommitDate && this.initialCommitDate.getTime() > this.mergedDate.getTime()) {
            errors.push("`initialCommitDate` is bigger than `mergedDate`. Recheck the import logic and timezones handling on this sample.");
        }

        // lastCommitDate
        if (this.lastCommitDate && this.lastCommitDate.getTime() > this.mergedDate.getTime()) {
            errors.push("`lastCommitDate` is bigger than `mergedDate`. Recheck the import logic and timezones handling on this sample.");
        }

        // mergedDate doesn't have any specific constraints except comparison with createdDate implemented above

        // participant.firstCommentDate
        if (this.participants.some(p => p.firstCommentDate && p.firstCommentDate.getTime() < this.createdDate.getTime())) {
            errors.push("`participant.firstCommentDate` is less than `pullRequest.createdDate`. Recheck the import logic and timezones handling on this sample.");
        }
        if (this.participants.some(p => p.firstCommentDate && p.lastCommentDate && p.firstCommentDate.getTime() > p.lastCommentDate.getTime())) {
            errors.push("`participant.firstCommentDate` is bigger than `participant.lastCommentDate`. Recheck the import logic and timezones handling on this sample.");
        }

        // participant.firstApprovalDate
        if (this.participants.some(p => p.firstApprovalDate && p.firstApprovalDate.getTime() < this.createdDate.getTime())) {
            errors.push("`participant.firstApprovalDate` is less than `pullRequest.createdDate`. Recheck the import logic and timezones handling on this sample.");
        }
        if (this.participants.some(p => p.firstApprovalDate && p.firstApprovalDate.getTime() > this.mergedDate.getTime())) {
            errors.push("`participant.firstApprovalDate` is bigger than `pullRequest.mergedDate`. Recheck the import logic and timezones handling on this sample.");
        }
        if (this.participants.some(p => p.firstApprovalDate && p.lastApprovalDate && p.firstApprovalDate.getTime() > p.lastApprovalDate.getTime())) {
            errors.push("`participant.firstApprovalDate` is bigger than `participant.lastApprovalDate`. Recheck the import logic and timezones handling on this sample.");
        }

        // participant.firstReviewDate
        if (this.participants.some(p => p.firstReviewDate && p.firstReviewDate.getTime() < this.createdDate.getTime())) {
            errors.push("`participant.firstReviewDate` is less than `pullRequest.createdDate`. Recheck the import logic and timezones handling on this sample.");
        }
        if (this.participants.some(p => p.firstReviewDate && p.firstReviewDate.getTime() > this.mergedDate.getTime())) {
            errors.push("`participant.firstReviewDate` is bigger than `pullRequest.mergedDate`. Recheck the import logic and timezones handling on this sample.");
        }
        if (this.participants.some(p => p.firstReviewDate && p.lastApprovalDate && p.firstReviewDate.getTime() > p.lastApprovalDate.getTime())) {
            errors.push("`participant.firstReviewDate` is bigger than `participant.lastApprovalDate`. Recheck the import logic and timezones handling on this sample.");
        }


        // participant.lastCommentDate
        if (this.participants.some(p => p.lastCommentDate && p.lastCommentDate.getTime() < this.createdDate.getTime())) {
            errors.push("`participant.lastCommentDate` is less than `pullRequest.createdDate`. Recheck the import logic and timezones handling on this sample.");
        }
        if (this.participants.some(p => !p.participant.isBotUser && p.lastCommentDate && p.lastCommentDate.getTime() < this.sharedForReviewDate.getTime())) {
            errors.push("`participant.lastCommentDate` is less than `pullRequest.sharedForReviewDate`. Possible reasons: should be marked as a bot, error in import logic and timezones handling.");
        }

        // participant.lastApprovalDate
        if (this.participants.some(p => p.lastApprovalDate && p.lastApprovalDate.getTime() < this.createdDate.getTime())) {
            errors.push("`participant.lastApprovalDate` is less than `pullRequest.createdDate`. Recheck the import logic and timezones handling on this sample.");
        }
        if (this.participants.some(p => p.lastApprovalDate && p.lastApprovalDate.getTime() > this.mergedDate.getTime())) {
            errors.push("`participant.lastApprovalDate` is bigger than `mergedDate`. Recheck the import logic and timezones handling on this sample.");
        }

        if (errors.length > 0) {
            this.integrityErrors = JSON.stringify(errors);
        } else {
            this.integrityErrors = null;
        }
        return errors;
    }
}

