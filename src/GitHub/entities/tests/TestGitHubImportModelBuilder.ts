import { ImportParams } from "../ImportParams";
import {
    GitHubPullRequestActivityReviewedModel,
    GitHubPullRequestReviewRequestActivityModel,
    GitHubUserModel
} from "../../GitHubAPI.contracts";
import dayjs from "dayjs";


export class TestGitHubImportModelBuilder {
    private model: ImportParams;
    private prCreatedAt = dayjs();

    prAuthor: GitHubUserModel = {
        login: "test.author",
        type: "User",
        html_url: "https://github.com/test.author"
    };

    firstReviewer: GitHubUserModel = {
        login: "first.reviewer",
        type: "User",
        html_url: "https://github.com/first.reviewer"
    };

    build(): ImportParams {
        return this.model;
    }

    reset() {
        this.model = null as any;
    }

    pullRequest(author = this.prAuthor, createdAt = this.prCreatedAt): this {
        this.model = {
            teamName: "Test team",
            botUserNames: ["dependabot"],
            pullRequest: {
                created_at: createdAt.toISOString(),
                updated_at: createdAt.add(1, "day").toISOString(),
                merged_at: createdAt.add(3, "hours").toISOString(),
                user: author,
                author_association: "OWNER",
                html_url: "https://github.com/TestOwner/TestRepo/pull/1",
                number: 1,
                requested_reviewers: [],
                assignees: [],
                base: {
                    ref: "main",
                    repo: {
                        owner: {
                            login: "TestOwner",
                            type: "Organization",
                            html_url: "https://github.com/TestOwner"
                        },
                        name: "TestRepo"
                    }
                }
            },
            activities: [],
            files: []
        };
        return this;
    }

    addReviewer(who = this.firstReviewer, when = this.prCreatedAt.add(5, "minutes")): this {
        const event: GitHubPullRequestReviewRequestActivityModel = {
            event: "review_requested",
            actor: {
                ...this.model.pullRequest.user
            },
            requested_reviewer: who,
            created_at: when.toISOString()
        };
        this.model.pullRequest.requested_reviewers.push(event.requested_reviewer!);
        this.model.activities.push(event);
        return this;
    }

    submitReview(who = this.firstReviewer, when = this.prCreatedAt.add(30, "minutes")): this {
        const event: GitHubPullRequestActivityReviewedModel = {
            event: "reviewed",
            user: who,
            submitted_at: when.toISOString(),
            body: "LGTM",
            state: "approved"
        };
        this.model.activities.push(event);
        return this;
    }

    removeReviewer(who = this.firstReviewer, when = this.prCreatedAt.add(10, "minutes")): this {
        const event: GitHubPullRequestReviewRequestActivityModel = {
            event: "review_request_removed",
            actor: {
                ...this.model.pullRequest.user
            },
            requested_reviewer: who,
            created_at: when.toISOString()
        };
        const index = this.model.pullRequest.requested_reviewers.findIndex(r => r.login == who.login);
        this.model.pullRequest.requested_reviewers.splice(index, 1);
        this.model.activities.push(event);
        return this;
    }
}