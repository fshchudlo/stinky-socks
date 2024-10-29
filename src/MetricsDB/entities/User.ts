import { Column, Entity, OneToMany, PrimaryGeneratedColumn, Unique } from "typeorm";
import { PullRequestParticipant } from "./PullRequestParticipant";
import { PullRequest } from "./PullRequest";


@Entity()
@Unique(["teamName", "nickname"])
@Unique(["teamName", "login"])
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    teamName: string;

    @Column()
    login: string;

    @Column({ default: false })
    isBotUser: boolean;

    @Column({ default: false })
    isFormerEmployee: boolean;

    @Column()
    nickname: string;

    @OneToMany(() => PullRequest, (pullRequest) => pullRequest.author)
    pullRequests: PullRequest[];

    @OneToMany(() => PullRequestParticipant, (participant) => participant.participant)
    participations: PullRequestParticipant[];
}