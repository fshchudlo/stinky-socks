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
    @JoinColumn([
        { name: "projectKey", referencedColumnName: "projectKey" },
        { name: "repositoryName", referencedColumnName: "repositoryName" },
        { name: "pullRequestNumber", referencedColumnName: "pullRequestNumber" }
    ])
    pullRequest: PullRequest;

    static fromBitbucket(participantName: string, pullRequestData: any, participantActivities: any[], botUsers: string[], formerEmployees: string[]): PullRequestParticipant {
        const entity = new PullRequestParticipant();
        entity.projectKey = pullRequestData.toRef.repository.project.key;
        entity.repositoryName = pullRequestData.toRef.repository.slug;
        entity.pullRequestNumber = pullRequestData.id;
        entity.participantName = participantName;

        entity.isBotUser = botUsers.includes(entity.participantName);
        entity.isFormerEmployee = formerEmployees.includes(entity.participantName);

        const comments = participantActivities.filter((a) => a.action === "COMMENTED" && !botUsers.includes(Utils.normalizeUserName(a.user.name)));

        const commentTimestamps = comments.map(c => c.createdDate as number);
        entity.firstCommentDate = commentTimestamps.length ? new Date(Math.min(...commentTimestamps)) : null as any;
        entity.lastCommentDate = commentTimestamps.length ? new Date(Math.max(...commentTimestamps)) : null as any;
        entity.commentsCount = comments.length;

        const approvals = participantActivities.filter(a => a.action === "APPROVED" && !botUsers.includes(Utils.normalizeUserName(a.user.name)));

        const approvalTimestamps = approvals.map(a => a.createdDate);
        entity.firstApprovalDate = approvalTimestamps.length ? new Date(Math.min(...approvalTimestamps)) : null as any;
        entity.lastApprovalDate = approvalTimestamps.length ? new Date(Math.max(...approvalTimestamps)) : null as any;
        return entity;
    }
}
  