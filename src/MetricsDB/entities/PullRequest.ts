import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn } from "typeorm";
import { PullRequestParticipant } from "./PullRequestParticipant";
import { User } from "./User";
import { PullRequestAuthorRole } from "./PullRequestAuthorRole";

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

    @Column({ nullable: true, type: "timestamp" })
    protected initialCommitDate: Date | null;

    @Column({ nullable: true, type: "timestamp" })
    protected lastCommitDate: Date | null;

    @Column({ nullable: true, type: "timestamp" })
    protected firstReactionDate: Date | null;

    @Column({ nullable: true, type: "timestamp" })
    protected lastApprovalDate: Date | null;

    @Column({ nullable: true, type: "timestamp" })
    protected reworkCompletedDate: Date | null;

    @Column()
    protected mergedDate: Date;

    @Column()
    protected requestedReviewersCount: number;

    @Column()
    protected totalCommentsCount: number;

    @Column({ type: "numeric" })
    protected diffSize: number;

    @Column()
    protected testsWereTouched: boolean;

    @Column({ type: "varchar" })
    protected authorRole: PullRequestAuthorRole;

    @Column({ nullable: true, type: "varchar" })
    protected integrityErrors: string | null;

    @OneToMany(() => PullRequestParticipant, (participant) => participant.pullRequest, {
        cascade: true
    })
    participants: PullRequestParticipant[];

    @ManyToOne(() => User, (author) => author.pullRequests, { onDelete: "CASCADE" })
    @JoinColumn()
    author: User;


    public calculateTimings() {
        this.firstReactionDate = this.participants
            .filter(p => !p.participant.isBotUser)
            .flatMap(p => [p.firstCommentDate, p.firstReviewDate, p.firstApprovalDate])
            .filter(d => d)
            .map(d => <Date>d)
            .filter(d => d.getTime() < this.mergedDate.getTime() && d.getTime() > this.sharedForReviewDate.getTime())
            .reduce((minDate: Date | null, date) => !minDate || date!.getTime() < (<Date>minDate).getTime() ? date : minDate, null);


        this.lastApprovalDate = this.participants
            .filter(p => !p.participant.isBotUser)
            .map(p => p.lastApprovalDate)
            .filter(d => d)
            .map(d => <Date>d)
            .reduce((maxDate: Date | null, date) => !maxDate || date!.getTime() > (<Date>maxDate).getTime() ? date : maxDate, null);

        this.reworkCompletedDate = [this.lastCommitDate, this.lastApprovalDate]
            .filter(d => d)
            .filter(d => d!.getTime() > this.sharedForReviewDate.getTime())
            .reduce((maxDate: Date | null, date) => !maxDate || date!.getTime() > (<Date>maxDate).getTime() ? date : maxDate, null);

        return this;
    }

    public validateDataIntegrity() {
        const errors: string[] = [];

        if (!this.initialCommitDate) {
            errors.push("`initialCommitDate` field is null. Is that possible that pull request has no commits?");
        }
        if (!this.lastCommitDate) {
            errors.push("`lastCommitDate` field is null. Is that possible that pull request has no commits?");
        }

        // createdDate
        if (this.createdDate.getTime() > this.updatedDate.getTime()) {
            errors.push("`createdDate` is bigger than `updatedDate`. Recheck the import logic and timezones handling on this sample.");
        }
        if (this.createdDate.getTime() > this.sharedForReviewDate.getTime()) {
            errors.push("`createdDate` is bigger than `sharedForReviewDate`. Recheck the import logic and timezones handling on this sample.");
        }
        if (this.initialCommitDate && this.createdDate.getTime() < this.initialCommitDate.getTime()) {
            errors.push("`createdDate` is less than `initialCommitDate`. Seems like git history was rewritten or there is an error in import logic.");
        }
        if (this.createdDate.getTime() > this.mergedDate.getTime()) {
            errors.push("`createdDate` is bigger than `mergedDate`. Recheck the import logic and timezones handling on this sample.");
        }
        // updatedDate doesn't have any specific constraints except comparison with createdDate implemented above

        // sharedForReviewDate
        if (this.initialCommitDate && this.sharedForReviewDate.getTime() < this.initialCommitDate.getTime()) {
            errors.push("`sharedForReviewDate` is less than `initialCommitDate`. Seems like git history was rewritten or there is an error in import logic.");
        }
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
        if (this.participants.some(p => !p.participant.isBotUser && p.firstCommentDate && p.firstCommentDate.getTime() < this.sharedForReviewDate.getTime())) {
            errors.push("`participant.firstCommentDate` is less than `pullRequest.sharedForReviewDate`. Recheck the import logic and timezones handling on this sample.");
        }
        if (this.participants.some(p => this.initialCommitDate && p.firstCommentDate && p.firstCommentDate.getTime() < this.initialCommitDate.getTime())) {
            errors.push("`participant.firstCommentDate` is less than `pullRequest.initialCommitDate`. Recheck the import logic and timezones handling on this sample.");
        }
        if (this.participants.some(p => p.firstCommentDate && p.lastCommentDate && p.firstCommentDate.getTime() > p.lastCommentDate.getTime())) {
            errors.push("`participant.firstCommentDate` is bigger than `participant.lastCommentDate`. Recheck the import logic and timezones handling on this sample.");
        }

        // participant.firstApprovalDate
        if (this.participants.some(p => p.firstApprovalDate && p.firstApprovalDate.getTime() < this.createdDate.getTime())) {
            errors.push("`participant.firstApprovalDate` is less than `pullRequest.createdDate`. Recheck the import logic and timezones handling on this sample.");
        }
        if (this.participants.some(p => p.firstApprovalDate && p.firstApprovalDate.getTime() < this.sharedForReviewDate.getTime())) {
            errors.push("`participant.firstApprovalDate` is less than `pullRequest.sharedForReviewDate`. Recheck the import logic and timezones handling on this sample.");
        }
        if (this.participants.some(p => this.initialCommitDate && p.firstApprovalDate && p.firstApprovalDate.getTime() < this.initialCommitDate.getTime())) {
            errors.push("`participant.firstApprovalDate` is less than `pullRequest.initialCommitDate`. Recheck the import logic and timezones handling on this sample.");
        }
        if (this.participants.some(p => p.firstApprovalDate && p.firstApprovalDate.getTime() > this.mergedDate.getTime())) {
            errors.push("`participant.firstApprovalDate` is bigger than `pullRequest.mergedDate`. Recheck the import logic and timezones handling on this sample.");
        }
        if (this.participants.some(p => p.firstApprovalDate && p.lastApprovalDate && p.firstApprovalDate.getTime() > p.lastApprovalDate.getTime())) {
            errors.push("`participant.firstApprovalDate` is bigger than `participant.lastApprovalDate`. Recheck the import logic and timezones handling on this sample.");
        }


        // participant.lastCommentDate
        if (this.participants.some(p => p.lastCommentDate && p.lastCommentDate.getTime() < this.createdDate.getTime())) {
            errors.push("`participant.lastCommentDate` is less than `pullRequest.createdDate`. Recheck the import logic and timezones handling on this sample.");
        }
        if (this.participants.some(p => !p.participant.isBotUser && p.lastCommentDate && p.lastCommentDate.getTime() < this.sharedForReviewDate.getTime())) {
            errors.push("`participant.lastCommentDate` is less than `pullRequest.sharedForReviewDate`. Recheck the import logic and timezones handling on this sample.");
        }
        if (this.participants.some(p => this.initialCommitDate && p.lastCommentDate && p.lastCommentDate.getTime() < this.initialCommitDate.getTime())) {
            errors.push("`participant.lastCommentDate` is less than `pullRequest.initialCommitDate`. Recheck the import logic and timezones handling on this sample.");
        }

        // participant.lastApprovalDate
        if (this.participants.some(p => p.lastApprovalDate && p.lastApprovalDate.getTime() < this.createdDate.getTime())) {
            errors.push("`participant.lastApprovalDate` is less than `pullRequest.createdDate`. Recheck the import logic and timezones handling on this sample.");
        }
        if (this.participants.some(p => p.lastApprovalDate && p.lastApprovalDate.getTime() < this.sharedForReviewDate.getTime())) {
            errors.push("`participant.lastApprovalDate` is less than `pullRequest.sharedForReviewDate`. Recheck the import logic and timezones handling on this sample.");
        }
        if (this.participants.some(p => this.initialCommitDate && p.lastApprovalDate && p.lastApprovalDate.getTime() < this.initialCommitDate.getTime())) {
            errors.push("`participant.lastApprovalDate` is less than `pullRequest.initialCommitDate`. Recheck the import logic and timezones handling on this sample.");
        }
        if (this.participants.some(p => p.lastApprovalDate && p.lastApprovalDate.getTime() > this.mergedDate.getTime())) {
            errors.push("`participant.lastApprovalDate` is bigger than `mergedDate`. Recheck the import logic and timezones handling on this sample.");
        }
        if (errors.length > 0) {
            this.integrityErrors = JSON.stringify(errors);

            console.warn(`☣️ PullRequest ${this.viewURL} has the following integrity errors:\n\t• ${errors.join("\n\t• ")}`);
        }
        return this;
    }
}

