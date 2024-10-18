export const Utils = {
    getHumanActivities(activities: any[], botUsers: string[], event: "APPROVED" | "RESCOPED" | undefined = undefined): any[] {
        return activities
            .filter(a => !event || a.event === event)
            .filter(a => !botUsers.includes(a.user.login));
    },
    getHumanComments(activities: any[], botUsers: string[]): any[] {
        return activities
            .filter(a => a.state === "commented")
            .filter(a => !botUsers.includes(a.user.login));
    }
};