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
        testsWereTouched(prDiff: any): boolean {
            return prDiff.diffs.some((diff: any) => diff.destination?.toString.includes("test"));
        }
    }
};