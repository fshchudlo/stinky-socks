import { Entity, Column, ManyToOne, JoinColumn, PrimaryGeneratedColumn } from "typeorm";
import { PullRequest } from "./PullRequest";
import { Utils } from "./Utils";

@Entity()
export class PullRequestParticipant {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    projectKey: string;

    @Column()
    repositoryName: string;

    @Column()
    pullRequestNumber: number;

    @Column()
    participantName: string;

    @Column({ nullable: true })
    firstCommentDate?: Date;

    @Column({ nullable: true })
    firstApprovalDate?: Date;

    @Column({ nullable: true })
    lastCommentDate?: Date;

    @Column({ nullable: true })
    lastApprovalDate?: Date;

    @Column()
    commentsCount: number;

    @Column()
    isBotUser: boolean;

    @Column()
    isFormerEmployee: boolean;

    @ManyToOne(() => PullRequest, (pr) => pr.participants)
    // Waiting for this PR to be merged: https://github.com/typeorm/typeorm/pull/11062
    @JoinColumn([
        { name: "project_key", referencedColumnName: "projectKey" },
        { name: "repository_name", referencedColumnName: "repositoryName" },
        { name: "pull_request_number", referencedColumnName: "pullRequestNumber" }
    ])
    pullRequest: PullRequest;

    static fromBitbucket(participantName: string, pullRequestData: any, participantActivities: any[], botUsers: string[], formerEmployees: string[]): PullRequestParticipant {
        return new PullRequestParticipant()
            .initializeBaseProperties(participantName, pullRequestData)
            .setUserStatus(botUsers, formerEmployees)
            .setCommentStats(participantActivities, botUsers)
            .setApprovalStats(participantActivities, botUsers);
    }

    private initializeBaseProperties(participantName: string, pullRequestData: any): PullRequestParticipant {
        this.projectKey = pullRequestData.toRef.repository.project.key;
        this.repositoryName = pullRequestData.toRef.repository.slug;
        this.pullRequestNumber = pullRequestData.id;
        this.participantName = participantName;
        return this;
    }

    private setUserStatus(botUsers: string[], formerEmployees: string[]): PullRequestParticipant {
        this.isBotUser = botUsers.includes(this.participantName);
        this.isFormerEmployee = formerEmployees.includes(this.participantName);
        return this;
    }

    private setCommentStats(participantActivities: any[], botUsers: string[]): PullRequestParticipant {
        const comments = Utils.Bitbucket.getHumanActivities(participantActivities, botUsers, "COMMENTED");

        const commentTimestamps = comments.map((c: any) => c.createdDate as number);
        this.firstCommentDate = commentTimestamps.length ? new Date(Math.min(...commentTimestamps)) : null as any;
        this.lastCommentDate = commentTimestamps.length ? new Date(Math.max(...commentTimestamps)) : null as any;
        this.commentsCount = comments.length;
        return this;
    }

    private setApprovalStats(participantActivities: any[], botUsers: string[]): PullRequestParticipant {
        const approvals = Utils.Bitbucket.getHumanActivities(participantActivities, botUsers, "APPROVED");

        const approvalTimestamps = approvals.map((a: any) => a.createdDate);
        this.firstApprovalDate = approvalTimestamps.length ? new Date(Math.min(...approvalTimestamps)) : null as any;
        this.lastApprovalDate = approvalTimestamps.length ? new Date(Math.max(...approvalTimestamps)) : null as any;
        return this;
    }

}
  