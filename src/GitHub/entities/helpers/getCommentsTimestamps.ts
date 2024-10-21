import { GitHubPullRequestActivityModel } from "../../api/GitHubAPI.contracts";
import { ActivityTraits } from "./ActivityTraits";

export default function getCommentsTimestamps(activities: GitHubPullRequestActivityModel[], botUsers: string[]=[]) {
    const comments = activities
        .filter(ActivityTraits.isCommentedEvent)
        .filter(a => !botUsers.includes(a.user.login))
        .map(c => new Date(c.created_at).getTime());

    const lineComments = activities.filter(ActivityTraits.isLineCommentedEvent)
        .flatMap(a => a.comments)
        .filter(a => !botUsers.includes(a.user.login))
        .map(c => new Date(c.created_at).getTime());

    const reviewComments = activities.filter(ActivityTraits.isReviewedEvent)
        .filter(a => !botUsers.includes(a.user.login))
        .filter(a => !!a.body)
        .map(c => new Date(c.submitted_at).getTime());

    return comments
        .concat(lineComments, reviewComments);
}