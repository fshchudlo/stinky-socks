import { GitHubPullRequestActivityModel } from "../api/GitHubAPI";

export default function getHumanComments(activities: GitHubPullRequestActivityModel[], botUsers: string[]) {
    return activities
        .filter(a => a.state === "commented")
        .filter(a => !botUsers.includes(a.user.login));
}