import { ImportParams } from "../ImportParams";
import {
    GitHubPullRequestActivityCommentedModel,
    GitHubPullRequestActivityCommitedModel,
    GitHubPullRequestActivityReadyForReviewModel,
    GitHubPullRequestActivityReviewedModel, GitHubPullRequestAuthorRole,
    GitHubPullRequestReviewRequestActivityModel,
    GitHubUserModel
} from "../../GitHubAPI.contracts";
import dayjs, { Dayjs } from "dayjs";


export class TestGitHubImportModelBuilder {
    private model: ImportParams;
    public prCreatedAt = dayjs();

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

    secondReviewer: GitHubUserModel = {
        login: "second.reviewer",
        type: "User",
        html_url: "https://github.com/second.reviewer"
    };

    botReviewer: GitHubUserModel = {
        login: "bot.reviewer",
        type: "Bot",
        html_url: "https://github.com/bot.reviewer"
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

    addCommit(when: Dayjs): this {
        const event: GitHubPullRequestActivityCommitedModel = {
            event: "committed",
            author: {
                date: when.toISOString()
            },
            committer: {
                date: when.toISOString()
            }
        };
        this.model.activities.push(event);
        return this;
    }

    addComment(who = this.firstReviewer, when: Dayjs = this.prCreatedAt.add(15, "minutes")): this {
        const event: GitHubPullRequestActivityCommentedModel = {
            event: "commented",
            user: {
                ...who
            },
            actor: {
                ...who
            },
            created_at: when.toISOString()
        };
        this.model.activities.push(event);
        return this;
    }

    isReadyForReview(when: Dayjs): this {
        const event: GitHubPullRequestActivityReadyForReviewModel = {
            event: "ready_for_review",
            actor: {
                ...this.model.pullRequest.user
            },
            created_at: when.toISOString()
        };
        this.model.activities.push(event);
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

    setAuthor(role: GitHubPullRequestAuthorRole): this {
        this.model.pullRequest.author_association = role;
        return this;
    }

    authorIsBot(): this {
        this.model.pullRequest.user.type = "Bot";
        return this;
    }

    addKnownBotUser(botUserLogin: string): this {
        this.model.botUserNames.push(botUserLogin);
        return this;
    }
}