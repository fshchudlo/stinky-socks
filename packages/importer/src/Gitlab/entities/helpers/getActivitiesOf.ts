import { GitlabPullRequestActivityModel } from "../../GitlabAPI.contracts";

export default function getActivitiesOf(activities: GitlabPullRequestActivityModel[], userName: string) {
    return activities.filter(a => a.author.username === userName);
}