import { GitHubPullRequestActivityModel } from "../../api/GitHubAPI.contracts";
import { ActivityTraits } from "./ActivityTraits";

export default function getCommentsTimestamps(activities: GitHubPullRequestActivityModel[], botUsers: string[]=[]) {
    const comments = activities
        .filter(ActivityTraits.isCommentedEvent)
        .filter(a => !botUsers.includes(a.user.login));

    const lineComments = activities.filter(ActivityTraits.isLineCommentedEvent)
        .flatMap(a => a.comments)
        .filter(a => !botUsers.includes(a.user.login));

    return comments.map(c => new Date(c.created_at!).getTime())
        .concat(lineComments.map(c => new Date(c.created_at!).getTime()));
}