import { GitHubPullRequestActivityModel } from "../../api/GitHubAPI.contracts";
import { ActivityTraits } from "./ActivityTraits";

export default function getActivitiesOf(activities: GitHubPullRequestActivityModel[], userName: string) {
    return activities.filter(a => {
        if (ActivityTraits.isLineCommentedEvent(a)) {
            return a.comments.map(c => c.user?.login).includes(userName);
        }

        const typedA = a as any;
        return (typedA.actor?.login || typedA.author?.login || typedA.user?.login) === userName;
    });
}