import { GitHubPullRequestActivityModel } from "../../api/GitHubAPI.contracts";
import { ActivityTraits } from "./ActivityTraits";

export default function getNonBotCommentsTimestamps(activities: GitHubPullRequestActivityModel[], botUsers: string[] = []) {
    const comments = activities
        .filter(ActivityTraits.isCommentedEvent)
        .filter(a => !(a.user && botUsers.includes(a.user.login)))
        .map(c => new Date(c.created_at).getTime());

    const lineComments = activities.filter(ActivityTraits.isLineCommentedEvent)
        .flatMap(a => a.comments)
        .filter(a => !(a.user && botUsers.includes(a.user.login)))
        .map(c => new Date(c.created_at).getTime());

    const reviewComments = activities.filter(ActivityTraits.isReviewedEvent)
        .filter(a => !(a.user && botUsers.includes(a.user.login)))
        .filter(a => a.state == "commented" || !!a.body)
        .map(c => new Date(c.submitted_at).getTime());

    return comments
        .concat(lineComments, reviewComments);
}