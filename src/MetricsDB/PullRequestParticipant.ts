import {
    Entity,
    Column,
    ManyToOne,
    JoinColumn,
    PrimaryGeneratedColumn,
  } from 'typeorm';
  import { PullRequest } from './PullRequest';
  
  @Entity('pull_request_participant')
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
      { name: 'projectKey', referencedColumnName: 'projectKey' },
      { name: 'repositoryName', referencedColumnName: 'repositoryName' },
      { name: 'pullRequestNumber', referencedColumnName: 'pullRequestNumber' },
    ])
    pullRequest: PullRequest;
  }
  