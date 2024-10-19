import { PullRequest } from "../../metrics-db/PullRequest";
import { Utils } from "./Utils";
import { GithubPullRequestParticipant } from "./GithubPullRequestParticipant";

export type ImportModel = {
    teamName: string;
    botUserNames: string[],
    formerEmployeeNames: string[],
    pullRequest: any,
    pullRequestActivities: any[],
    files: any
}

export class GithubPullRequest extends PullRequest {
    constructor(model: ImportModel) {
        super();
        this.initializeBaseProperties(model)
            .initializeDates(model)
            .calculateCommitStats(model)
            .initializeParticipants(model);
    }

    private initializeBaseProperties(model: ImportModel): GithubPullRequest {
        this.teamName = model.teamName;
        this.projectKey = model.pullRequest.base.repo.owner.login;
        this.repositoryName = model.pullRequest.base.repo.name;
        this.pullRequestNumber = model.pullRequest.number;
        this.author = model.pullRequest.user.login;
        this.viewURL = model.pullRequest.html_url;
        this.authorIsBotUser = model.botUserNames.includes(this.author);
        this.authorIsFormerEmployee = model.formerEmployeeNames.includes(this.author);
        this.targetBranch = model.pullRequest.base.ref;
        this.reviewersCount = model.pullRequest.requested_reviewers.length;
        return this;
    }

    private initializeDates(model: ImportModel): GithubPullRequest {
        this.openedDate = this.calculatePrOpenDate(model);
        this.mergedDate = new Date(model.pullRequest.merged_at);

        const commitTimestamps = model.pullRequestActivities.filter(a => a.event == "committed").map((c) => new Date(c.committer.date).getTime());
        this.initialCommitDate = new Date(Math.min(...commitTimestamps));
        this.lastCommitDate = new Date(Math.max(...commitTimestamps));

        return this;
    }

    private calculateCommitStats(model: ImportModel): GithubPullRequest {
        this.commentsCount = Utils.getHumanComments(model.pullRequestActivities, model.botUserNames).length;
        this.diffSize = model.files.reduce((acc: any, file: any) => acc + file.changes, 0);
        this.testsWereTouched = model.files.some((f: any) => f.filename.toLowerCase().includes("test"));
        return this;
    }

    private initializeParticipants(model: ImportModel): GithubPullRequest {
        const allParticipants = new Set<string>([
            ...model.pullRequest.reviewers.map((r: any) => r.user.slug),
            ...model.pullRequest.participants.map((p: any) => p.user.slug)
        ]);

        this.participants = Array.from(allParticipants).map((participantName) =>
            new GithubPullRequestParticipant(
                participantName,
                model.pullRequest,
                GithubPullRequest.getActivitiesOf(model.pullRequestActivities, participantName),
                model.botUserNames,
                model.formerEmployeeNames
            )
        );
        return this;
    }

    private calculatePrOpenDate(model: ImportModel): Date {
        const reviewerAdditions = model.pullRequestActivities.filter(a => a.event == "review_requested");

        if (reviewerAdditions.length > 0) {
            throw new Error(`Method not implemented`);
            const initialReviewersSlugs = new Set<string>(model.pullRequest.reviewers.map((r: any) => r.user.slug).filter((s: any) => !model.botUserNames.includes(s)));
            const addedReviewersSlugs = new Set<string>(reviewerAdditions.flatMap(a => a.addedReviewers?.map((r: any) => r.slug) || []));

            // If all initial reviewers were added after PR was opened
            if ([...initialReviewersSlugs].every(s => addedReviewersSlugs.has(s))) {
                // Return the date of the earliest activity where reviewers were added
                const earliestAddingDate = Math.min(...reviewerAdditions.map(activity => activity.createdDate));
                return new Date(earliestAddingDate);
            }
        }
        return new Date(model.pullRequest.created_at);
    }

    private static getActivitiesOf(activities: any[], userName: string): any[] {
        return activities.filter(a => a.user.login === userName);
    }
}
