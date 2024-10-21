import { GitHubPullRequestActivityModel } from "../../api/GitHubAPI.contracts";
import { ActivityTraits } from "./ActivityTraits";

export default function getHumanComments(activities: GitHubPullRequestActivityModel[], botUsers: string[]) {
    return activities
        .filter(ActivityTraits.isCommentedEvent)
        .filter(a => !botUsers.includes(a.user.login));
}