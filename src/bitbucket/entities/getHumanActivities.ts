import { BitbucketPullRequestActivityModel } from "../api/BitbucketAPI";

export default function getHumanActivities(activities: BitbucketPullRequestActivityModel[], botUsers: string[], actionType: "COMMENTED" | "APPROVED"): any[] {
    return activities
        .filter(a => a.action === actionType)
        .filter(a => !botUsers.includes(a.user.slug));
}