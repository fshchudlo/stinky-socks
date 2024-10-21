import { GitHubPullRequestActivityModel } from "../../api/GitHubAPI.contracts";
import { ActivityTraits } from "./ActivityTraits";

export default function getHumanLineComments(activities: GitHubPullRequestActivityModel[], botUsers: string[]) {
    return activities
        .filter(ActivityTraits.isLineCommentedEvent)
        .flatMap(a => a.comments)
        .filter(a => !botUsers.includes(a.user.login));
}