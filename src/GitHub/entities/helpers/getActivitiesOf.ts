import { GitHubPullRequestActivityModel } from "../../api/GitHubAPI.contracts";
import { ActivityTraits } from "./ActivityTraits";

export default function getActivitiesOf(activities: GitHubPullRequestActivityModel[], userName: string) {
    return activities.filter(activity => {
        if (ActivityTraits.isLineCommentedEvent(activity)) {
            return activity.comments.map(c => c.user?.login).includes(userName);
        }

        const anyActivity = activity as any;
        return (anyActivity.actor?.login || anyActivity.author?.login || anyActivity.user?.login) === userName;
    });
}