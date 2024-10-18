import { BitbucketPullRequestActivityModel } from "../api/BitbucketAPI";

export const Utils = {
    getHumanActivities(activities: BitbucketPullRequestActivityModel[], botUsers: string[], actionType: "COMMENTED" | "APPROVED" | "RESCOPED" | undefined = undefined): any[] {
        return activities
            .filter(a => !actionType || a.action === actionType)
            .filter(a => !botUsers.includes(a.user.slug));
    }
};