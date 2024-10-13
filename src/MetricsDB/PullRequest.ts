import { Entity, Column, PrimaryColumn, OneToMany } from 'typeorm';
import { PullRequestParticipant } from './PullRequestParticipant';

@Entity('pull_request')
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
    cascade: true,
  })
  participants: PullRequestParticipant[];
}
