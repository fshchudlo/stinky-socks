import { ImportParams } from "../ImportParams";
import {
    GitHubFileDiffModel,
    GitHubPullRequestActivityCommentedModel,
    GitHubPullRequestActivityCommitedModel, GitHubPullRequestActivityLineCommentedModel,
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

    build(): ImportParams {
        return this.model;
    }

    reset() {
        this.model = null as any;
    }

    pullRequest(author = this.prAuthor, createdAt = this.prCreatedAt): this {
        this.model = {
            teamName: "Test team",
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

    addCommit(when: Dayjs, who = this.prAuthor, changedFiles: GitHubFileDiffModel[] = [{
        additions: 10,
        deletions: 5,
        filename: "src/index.ts"
    }]): this {
        const event: GitHubPullRequestActivityCommitedModel = {
            event: "committed",
            message: "Some commit",
            html_url: "https://github.com/TestOwner/TestRepo/pull/1/commits/43535bdaosd87",
            author: {
                date: when.toISOString(),
                name: who.login
            },
            committer: {
                date: when.toISOString(),
                name: who.login
            }
        };
        this.model.activities.push(event);
        this.model.files.push(...changedFiles);
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
            body: "Some comment",
            html_url: "https://github.com/TestOwner/TestRepo/pull/1#issuecomment-1",
            created_at: when.toISOString()
        };
        this.model.activities.push(event);
        return this;
    }

    addLineComment(who = this.firstReviewer, when: Dayjs = this.prCreatedAt.add(15, "minutes")): this {
        const event: GitHubPullRequestActivityLineCommentedModel = {
            event: "line-commented",
            comments: [{
                user: {
                    ...who
                },
                body: "Some comment",
                html_url: "https://github.com/TestOwner/TestRepo/pull/1#issuecomment-1",
                created_at: when.toISOString()
            }]
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

    addAssignee(who = this.firstReviewer): this {
        this.model.pullRequest.assignees.push(who);
        return this;
    }

    submitReview(who = this.firstReviewer, when = this.prCreatedAt.add(30, "minutes")): this {
        const event: GitHubPullRequestActivityReviewedModel = {
            event: "reviewed",
            html_url: "https://github.com/TestOwner/TestRepo/pull/1#pullrequestreview-1",
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

    merge(who = this.firstReviewer, when = this.prCreatedAt.add(3, "hours")) {
        this.model.activities.push({
            event: "merged",
            actor: who,
            created_at: this.prCreatedAt.add(2, "hours").toISOString()
        });
        this.model.pullRequest.merged_at = when.toISOString();
        return this;
    }
}