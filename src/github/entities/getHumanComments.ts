export default function getHumanComments(activities: any[], botUsers: string[]): any[] {
    return activities
        .filter(a => a.state === "commented")
        .filter(a => !botUsers.includes(a.user.login));
}