import { ActivityTraits, GitHubPullRequestActivityModel } from "../api/contracts";

export default function getHumanComments(activities: GitHubPullRequestActivityModel[], botUsers: string[]) {
    return activities
        .filter(ActivityTraits.isCommentedEvent)
        .filter(a => !botUsers.includes(a.user.login));
}