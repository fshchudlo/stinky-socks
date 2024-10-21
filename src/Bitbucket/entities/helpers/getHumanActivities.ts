import { BitbucketPullRequestActivityModel } from "../../api/BitbucketAPI.contracts";

export default function getHumanActivities(activities: BitbucketPullRequestActivityModel[], botUsers: string[], actionType: "COMMENTED" | "APPROVED") {
    return activities
        .filter(a => a.action === actionType)
        .filter(a => !botUsers.includes(a.user.slug));
}