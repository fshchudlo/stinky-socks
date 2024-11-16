import { GitHubPullRequestAuthorRole } from "../../api/GitHubAPI.contracts";
import { ActorRole } from "../../../MetricsDB/entities/ActorRole";

export function mapGithubUserAssociationToActorRole(association: GitHubPullRequestAuthorRole): ActorRole {
    switch (association) {
        case GitHubPullRequestAuthorRole.OWNER:
        case GitHubPullRequestAuthorRole.MEMBER:
        case GitHubPullRequestAuthorRole.COLLABORATOR:
            return ActorRole.MEMBER;
        case GitHubPullRequestAuthorRole.CONTRIBUTOR:
        case GitHubPullRequestAuthorRole.FIRST_TIMER:
        case GitHubPullRequestAuthorRole.FIRST_TIME_CONTRIBUTOR:
            return ActorRole.CONTRIBUTOR;
        case GitHubPullRequestAuthorRole.MANNEQUIN:
        case GitHubPullRequestAuthorRole.NONE:
            return ActorRole.UNKNOWN;
        default:
            throw new Error(`Unknown GitHubPullRequestAuthorRole: ${association}`);
    }
}