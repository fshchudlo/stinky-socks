import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
import { PullRequestParticipant } from "./PullRequestParticipant";
import { Utils } from "./Utils";
import { BitbucketPullRequestImportModel } from "../typings";

@Entity()
export class PullRequest {
    @PrimaryColumn()
    projectKey: string;

    @PrimaryColumn()
    repositoryName: string;

    @PrimaryColumn()
    pullRequestNumber: number;

    @Column()
    teamName: string;

    @Column()
    author: string;

    @Column()
    viewURL: string;

    @Column()
    authorIsBotUser: boolean;

    @Column()
    authorIsFormerEmployee: boolean;

    @Column()
    targetBranch: string;

    @Column()
    openedDate: Date;

    @Column({ nullable: true })
    initialCommitDate?: Date;

    @Column()
    lastCommitDate: Date;

    @Column()
    mergedDate: Date;

    @Column()
    reviewersCount: number;

    @Column()
    approvalsCount: number;

    @Column()
    participantsCount: number;

    @Column()
    resolvedTasksCount: number;

    @Column()
    openTasksCount: number;

    @Column()
    commentsCount: number;

    @Column()
    commitsAfterFirstApprovalCount: number;

    @Column()
    rebasesCount: number;

    @Column()
    diffSize: number;

    @Column()
    testsWereTouched: boolean;

    @OneToMany(() => PullRequestParticipant, (participant) => participant.pullRequest, {
        cascade: true
    })
    participants: PullRequestParticipant[];

    static fromBitbucket(model: BitbucketPullRequestImportModel): PullRequest {
        return new PullRequest()
            .initializeBaseProperties(model)
            .initializeDates(model)
            .calculateApprovalAndReviewStats(model)
            .calculateTaskStats(model)
            .calculateCommitStats(model)
            .buildParticipants(model);
    }

    private initializeBaseProperties(model: BitbucketPullRequestImportModel): PullRequest {
        this.teamName = model.teamName;
        this.projectKey = model.pullRequest.toRef.repository.project.key;
        this.repositoryName = model.pullRequest.toRef.repository.slug;
        this.pullRequestNumber = model.pullRequest.id;
        this.author = Utils.normalizeUserName(model.pullRequest.author.user.name);
        this.viewURL = model.pullRequest.links.self[0].href;
        this.authorIsBotUser = model.botUsers.includes(this.author);
        this.authorIsFormerEmployee = model.formerEmployees.includes(this.author);
        this.targetBranch = model.pullRequest.toRef.displayId;
        return this;
    }

    private initializeDates(model: BitbucketPullRequestImportModel): PullRequest {
        const commitTimestamps = model.commits.map((c) => c.authorTimestamp as number);

        if (!commitTimestamps.length) {
            throw new Error(`No commits found for pull request ${model.pullRequest.id}`);
        }

        this.openedDate = this.calculatePrOpenDate(model);
        this.mergedDate = new Date(model.pullRequest.closedDate);
        this.initialCommitDate = new Date(Math.min(...commitTimestamps));
        this.lastCommitDate = new Date(Math.max(...commitTimestamps));
        return this;
    }

    private calculateApprovalAndReviewStats(model: BitbucketPullRequestImportModel): PullRequest {
        this.reviewersCount = model.pullRequest.reviewers.length;
        this.participantsCount = model.pullRequest.participants.length;
        this.approvalsCount = Utils.Bitbucket.getApprovers(model.pullRequestActivities, model.botUsers).size;
        return this;
    }

    private calculateTaskStats(model: BitbucketPullRequestImportModel): PullRequest {
        this.resolvedTasksCount = model.pullRequest.properties?.resolvedTaskCount || 0;
        this.openTasksCount = model.pullRequest.properties?.openTaskCount || 0;
        return this;
    }

    private calculateCommitStats(model: BitbucketPullRequestImportModel): PullRequest {
        this.commentsCount = Utils.Bitbucket.getHumanActivities(model.pullRequestActivities, model.botUsers, "COMMENTED").length;
        this.commitsAfterFirstApprovalCount = model.commits.filter(
            (c) => new Date(c.committerTimestamp) > this.openedDate
        ).length;
        this.rebasesCount = Utils.Bitbucket.getRebases(model.pullRequestActivities).length;
        this.diffSize = Utils.Bitbucket.getDiffSize(model.diff);
        this.testsWereTouched = Utils.Bitbucket.testsWereTouched(model.diff);
        return this;
    }

    private calculatePrOpenDate(model: BitbucketPullRequestImportModel): Date {
        const reviewerAdditions = model.pullRequestActivities.filter(a => "addedReviewers" in a);

        if (reviewerAdditions.length > 0) {
            const initialReviewersNames = new Set<string>(model.pullRequest.reviewers.map((r: any) => r.user.name).filter((name: string) => !model.botUsers.includes(name)));
            const addedReviewersNames = new Set<string>(reviewerAdditions.flatMap(a => a.addedReviewers?.map((r: any) => r.name) || []));

            // If all initial reviewers were added after PR was opened
            if ([...initialReviewersNames].every(name => addedReviewersNames.has(name))) {
                // Return the date of the earliest activity where reviewers were added
                const earliestAddingDate = Math.min(...reviewerAdditions.map(activity => activity.createdDate));
                return new Date(earliestAddingDate);
            }
        }
        return new Date(model.pullRequest.createdDate);
    }

    private buildParticipants(model: BitbucketPullRequestImportModel): PullRequest {
        const allParticipants = new Set<string>([
            ...model.pullRequest.reviewers.map((r: any) => Utils.normalizeUserName(r.user.name)),
            ...model.pullRequest.participants.map((p: any) => Utils.normalizeUserName(p.user.name))
        ]);

        this.participants = Array.from(allParticipants).map((participantName) =>
            PullRequestParticipant.fromBitbucket(
                participantName,
                model.pullRequest,
                Utils.Bitbucket.getActivitiesOf(model.pullRequestActivities, participantName),
                model.botUsers,
                model.formerEmployees
            )
        );
        return this;
    }
}
