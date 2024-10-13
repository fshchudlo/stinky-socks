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

    static fromBitbucket(teamTraits: TeamTraits,
                         pullRequestData: any,
                         activities: any[],
                         commits: any[],
                         diff: any): PullRequest {

        const entity = new PullRequest();
        entity.teamName = teamTraits.teamName;
        entity.projectKey = pullRequestData.toRef.repository.project.key;
        entity.repositoryName = pullRequestData.toRef.repository.slug;
        entity.pullRequestNumber = pullRequestData.id;
        entity.author = Utils.normalizeUserName(pullRequestData.author.user.name);
        entity.viewURL = pullRequestData.links.self[0].href;
        entity.authorIsBotUser = teamTraits.botUsers.includes(entity.author);
        entity.authorIsFormerEmployee = teamTraits.formerEmployees.includes(entity.author);

        entity.targetBranch = pullRequestData.toRef.displayId;
        entity.openedDate = new Date(pullRequestData.createdDate);
        entity.mergedDate = new Date(pullRequestData.closedDate);

        const commitTimestamps = commits.map((c) => c.authorTimestamp as number);
        if (!commitTimestamps.length) {
            throw new Error("No commits found for pull request");
        }

        entity.initialCommitDate = new Date(Math.min(...commitTimestamps));
        entity.lastCommitDate = new Date(Math.max(...commitTimestamps));

        entity.reviewersCount = pullRequestData.reviewers.length;
        entity.participantsCount = pullRequestData.participants.length;
        entity.approvalsCount = Utils.Bitbucket.getApprovers(activities, teamTraits.botUsers).size;

        entity.resolvedTasksCount = pullRequestData.properties?.resolvedTaskCount || 0;
        entity.openTasksCount = pullRequestData.properties?.openTaskCount || 0;

        entity.commentsCount = Utils.Bitbucket.getHumanComments(activities, teamTraits.botUsers).length;
        entity.commitsAfterFirstApprovalCount = commits.filter(
            (c) => new Date(c.committerTimestamp) > entity.openedDate
        ).length;

        entity.rebasesCount = Utils.Bitbucket.getRebases(activities).length;
        entity.diffSize = Utils.Bitbucket.getDiffSize(diff);
        entity.testsWereTouched = teamTraits.testsWereTouched;

        const allParticipants = new Set<string>([
            ...pullRequestData.reviewers.map((r: any) => Utils.normalizeUserName(r.user.name)),
            ...pullRequestData.participants.map((p: any) => Utils.normalizeUserName(p.user.name))
        ]);

        entity.participants = Array.from(allParticipants).map(
            (participantName) =>
                PullRequestParticipant.fromBitbucket(
                    participantName,
                    pullRequestData,
                    Utils.Bitbucket.getActivitiesOf(activities, participantName),
                    teamTraits.botUsers, teamTraits.formerEmployees
                )
        );
        return entity;
    }
}
