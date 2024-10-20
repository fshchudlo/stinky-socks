import { ActivityTraits, GitHubPullRequestActivityModel } from "../api/contracts";

export default function getHumanLineComments(activities: GitHubPullRequestActivityModel[], botUsers: string[]) {
    return activities
        .filter(ActivityTraits.isLineCommentedEvent)
        .flatMap(a => a.comments)
        .filter(a => !botUsers.includes(a.user.login));
}