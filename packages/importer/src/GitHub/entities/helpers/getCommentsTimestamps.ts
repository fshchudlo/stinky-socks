import { GitHubPullRequestActivityModel } from "../../GitHubAPI.contracts";
import { ActivityTraits } from "./ActivityTraits";

export function getCommentsTimestamps(activities: GitHubPullRequestActivityModel[]) {
    const comments = activities
        .filter(ActivityTraits.isCommentedEvent)
        .map(c => new Date(c.created_at).getTime());

    const lineComments = activities.filter(ActivityTraits.isLineCommentedEvent)
        .flatMap(a => a.comments)
        .map(c => new Date(c.created_at).getTime());

    const reviewComments = activities.filter(ActivityTraits.isReviewedEvent)
        .filter(a => a.state == "commented" || !!a.body)
        .map(c => new Date(c.submitted_at).getTime());

    return comments
        .concat(lineComments, reviewComments);
}