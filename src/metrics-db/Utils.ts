export const Utils = {
    normalizeUserName(userName: string): string {
        return userName.toLowerCase();
    },
    Bitbucket: {
        getActivitiesOf(activities: any[], userName: string): any[] {
            return activities.filter(a => Utils.normalizeUserName(a.user.name) === Utils.normalizeUserName(userName));
        },
        getHumanActivities(activities: any[], botUsers: string[], actionType: "COMMENTED" | "APPROVED" | "RESCOPED" | undefined = undefined): any[] {
            return activities
                .filter(a => !actionType || a.action === actionType)
                .filter(a => !botUsers.includes(Utils.normalizeUserName(a.user.name)));
        },

        getApprovers(activities: any[], botUsers: string[]): Set<string> {
            const approvers = Utils.Bitbucket.getHumanActivities(activities, botUsers, "APPROVED");
            return new Set(approvers.map((a) => Utils.normalizeUserName(a.user.name)));
        },

        getRebases(activities: any[]): any[] {
            return activities.filter(a => a.action === "RESCOPED" && a.fromHash !== a.previousFromHash);
        },

        getDiffSize(diffData: any): number {
            let linesChanged = 0;
            diffData.diffs.forEach((d: any) => {
                if (!d.hunks) return;
                d.hunks.forEach((hunk: any) => {
                    hunk.segments.forEach((segment: any) => {
                        if (segment.type === "ADDED" || segment.type === "DELETED") {
                            linesChanged += segment.lines.length;
                        }
                    });
                });
            });
            return linesChanged;
        },
        defaultTestsWereTouchedDetector(prDiff: any): boolean {
            return prDiff.diffs.some((diff: any) => diff.destination?.toString.includes("test"));
        }
    }
};