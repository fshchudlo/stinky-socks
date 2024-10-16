import { BitbucketPullRequestActivityModel } from "../api/BitbucketAPI";

export const Utils = {
    normalizeUserName(userName: string): string {
        userName = userName.trim();

        // Convert "john.doe" to jdoe
        if (userName.includes(".")) {
            const [firstName, lastName] = userName.split(".");
            return `${firstName[0].toLowerCase()}${lastName.toLowerCase()}`;
        }

        // Convert "John Doe" to jdoe
        const nameParts = userName.split(/\s+/);
        if (nameParts.length === 2) {
            const [firstName, lastName] = nameParts;
            return `${firstName[0].toLowerCase()}${lastName.toLowerCase()}`;
        }
        // If it's already in "jdoe" format (no spaces or dots), return it as lowercase
        return userName.toLowerCase();
    },
    getHumanActivities(activities: BitbucketPullRequestActivityModel[], botUsers: string[], actionType: "COMMENTED" | "APPROVED" | "RESCOPED" | undefined = undefined): any[] {
        return activities
            .filter(a => !actionType || a.action === actionType)
            .filter(a => !botUsers.includes(Utils.normalizeUserName(a.user.name)));
    }
};