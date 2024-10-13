import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
import { PullRequestParticipant } from "./PullRequestParticipant";
import { Utils } from "./Utils";
import { TeamTraits } from "../TeamTraits";

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

    static fromBitbucket(teamTraits: TeamTraits, pullRequestData: any, activities: any[], commits: any[], diff: any): PullRequest {
        return new PullRequest()
            .initializeBaseProperties(teamTraits, pullRequestData)
            .initializeDates(pullRequestData, commits)
            .calculateApprovalAndReviewStats(pullRequestData, activities, teamTraits)
            .calculateTaskStats(pullRequestData)
            .calculateCommitStats(commits, activities, diff, teamTraits)
            .buildParticipants(pullRequestData, activities, teamTraits);
    }

    private initializeBaseProperties(teamTraits: TeamTraits, pullRequestData: any): PullRequest {
        this.teamName = teamTraits.teamName;
        this.projectKey = pullRequestData.toRef.repository.project.key;
        this.repositoryName = pullRequestData.toRef.repository.slug;
        this.pullRequestNumber = pullRequestData.id;
        this.author = Utils.normalizeUserName(pullRequestData.author.user.name);
        this.viewURL = pullRequestData.links.self[0].href;
        this.authorIsBotUser = teamTraits.botUsers.includes(this.author);
        this.authorIsFormerEmployee = teamTraits.formerEmployees.includes(this.author);
        this.targetBranch = pullRequestData.toRef.displayId;
        return this;
    }

    private initializeDates(pullRequestData: any, commits: any[]): PullRequest {
        const commitTimestamps = commits.map((c) => c.authorTimestamp as number);

        if (!commitTimestamps.length) {
            throw new Error(`No commits found for pull request ${pullRequestData.id}`);
        }

        this.openedDate = new Date(pullRequestData.createdDate);
        this.mergedDate = new Date(pullRequestData.closedDate);
        this.initialCommitDate = new Date(Math.min(...commitTimestamps));
        this.lastCommitDate = new Date(Math.max(...commitTimestamps));
        return this;
    }

    private calculateApprovalAndReviewStats(pullRequestData: any, activities: any[], teamTraits: TeamTraits): PullRequest {
        this.reviewersCount = pullRequestData.reviewers.length;
        this.participantsCount = pullRequestData.participants.length;
        this.approvalsCount = Utils.Bitbucket.getApprovers(activities, teamTraits.botUsers).size;
        return this;
    }

    private calculateTaskStats(pullRequestData: any): PullRequest {
        this.resolvedTasksCount = pullRequestData.properties?.resolvedTaskCount || 0;
        this.openTasksCount = pullRequestData.properties?.openTaskCount || 0;
        return this;
    }

    private calculateCommitStats(commits: any[], activities: any[], diff: any, teamTraits: TeamTraits): PullRequest {
        this.commentsCount = Utils.Bitbucket.getHumanActivities(activities, teamTraits.botUsers, "COMMENTED").length;
        this.commitsAfterFirstApprovalCount = commits.filter(
            (c) => new Date(c.committerTimestamp) > this.openedDate
        ).length;
        this.rebasesCount = Utils.Bitbucket.getRebases(activities).length;
        this.diffSize = Utils.Bitbucket.getDiffSize(diff);
        this.testsWereTouched = teamTraits.testsWereTouched;
        return this;
    }

    private buildParticipants(pullRequestData: any, activities: any[], teamTraits: TeamTraits): PullRequest {
        const allParticipants = new Set<string>([
            ...pullRequestData.reviewers.map((r: any) => Utils.normalizeUserName(r.user.name)),
            ...pullRequestData.participants.map((p: any) => Utils.normalizeUserName(p.user.name))
        ]);

        this.participants = Array.from(allParticipants).map((participantName) =>
            PullRequestParticipant.fromBitbucket(
                participantName,
                pullRequestData,
                Utils.Bitbucket.getActivitiesOf(activities, participantName),
                teamTraits.botUsers,
                teamTraits.formerEmployees
            )
        );
        return this;
    }
}
