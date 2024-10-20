import { GitHubPullRequestActivityModel } from "../api/GitHubAPI";

export default function getHumanLineComments(activities: GitHubPullRequestActivityModel[], botUsers: string[]) {
    return activities
        .filter(a => a.event === "line-commented")
        .flatMap(a => a.comments)
        .filter(a => !botUsers.includes(a.user.login));
}