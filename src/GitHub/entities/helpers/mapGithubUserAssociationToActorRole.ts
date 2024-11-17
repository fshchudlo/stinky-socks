import { ActorRole } from "../../../MetricsDB/entities/ActorRole";
import { GitHubPullRequestAuthorRole } from "../../GitHubAPI.contracts";

export function mapGithubUserAssociationToActorRole(association: GitHubPullRequestAuthorRole): ActorRole {
    switch (association) {
        case "OWNER":
        case "MEMBER":
        case "COLLABORATOR":
            return ActorRole.MEMBER;
        case "CONTRIBUTOR":
        case "FIRST_TIMER":
        case "FIRST_TIME_CONTRIBUTOR":
            return ActorRole.CONTRIBUTOR;
        case "MANNEQUIN":
        case "NONE":
            return ActorRole.UNKNOWN;
        default:
            throw new Error(`Unknown GitHubPullRequestAuthorRole: ${association}`);
    }
}