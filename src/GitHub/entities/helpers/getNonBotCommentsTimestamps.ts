import { GitHubPullRequestActivityModel, GitHubUserModel } from "../../api/GitHubAPI.contracts";
import { ActivityTraits } from "./ActivityTraits";

function isNotABotUser(user: GitHubUserModel | undefined, botUsers: string[]) {
    return !(user && (botUsers.includes(user.login) || user.type === "Bot"));
}

export default function getNonBotCommentsTimestamps(activities: GitHubPullRequestActivityModel[], botUsers: string[] = []) {
    const comments = activities
        .filter(ActivityTraits.isCommentedEvent)
        .filter(a => isNotABotUser(a.user, botUsers))
        .map(c => new Date(c.created_at).getTime());

    const lineComments = activities.filter(ActivityTraits.isLineCommentedEvent)
        .flatMap(a => a.comments)
        .filter(a => isNotABotUser(a.user, botUsers))
        .map(c => new Date(c.created_at).getTime());

    const reviewComments = activities.filter(ActivityTraits.isReviewedEvent)
        .filter(a => isNotABotUser(a.user, botUsers))
        .filter(a => a.state == "commented" || !!a.body)
        .map(c => new Date(c.submitted_at).getTime());

    return comments
        .concat(lineComments, reviewComments);
}