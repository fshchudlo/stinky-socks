import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique } from "typeorm";
import { PullRequestParticipant } from "./PullRequestParticipant";
import { PullRequest } from "./PullRequest";
import { ActorTeamRole } from "./ActorTeamRole";


@Entity()
@Unique(["teamName", "nickname"])
@Unique(["teamName", "login"])
export class Actor {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    teamName: string;

    @Column()
    login: string;

    @Column({ default: false })
    isBotUser: boolean;

    @Column({ default: false })
    isFormerParticipant: boolean;

    @Column()
    nickname: string;

    @Column({ type: "varchar", nullable: true })
    teamRole: ActorTeamRole | null;

    @ManyToOne(() => Actor, (actor) => actor.duplicates, { nullable: true })
    mergedWith?: Actor;

    @OneToMany(() => Actor, (actor) => actor.mergedWith)
    duplicates: Actor[];

    @OneToMany(() => PullRequest, (pullRequest) => pullRequest.author)
    pullRequests: PullRequest[];

    @OneToMany(() => PullRequestParticipant, (participant) => participant.participant)
    participations: PullRequestParticipant[];
}
