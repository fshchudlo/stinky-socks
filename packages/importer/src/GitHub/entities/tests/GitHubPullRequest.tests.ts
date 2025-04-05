import { GitHubPullRequest } from "../GitHubPullRequest";
import { ActorFactory } from "../../../MetricsDB/ActorFactory";
import { TestGitHubImportModelBuilder } from "./TestGitHubImportModelBuilder";
import { ActorRole } from "../../../MetricsDB/entities/ActorRole";
import { GitHubPullRequestAuthorRole } from "../../GitHubAPI.contracts";
import { GitHubUserModel } from "../../GitHubAPI.contracts";

let fetchCallsCounter = 0;
const actorFactorySpy = jest.spyOn(ActorFactory, "fetch").mockImplementation(async ({ teamName, login, isBotUser }: {
    teamName: string,
    login: string,
    isBotUser: boolean
}) => {
    return Promise.resolve({
        id: ++fetchCallsCounter,
        login: login,
        teamName: teamName,
        nickname: `${login} nickname`,
        isBotUser: isBotUser,
        isFormerParticipant: false,
        duplicates: [],
        participations: [],
        pullRequests: [],
        teamRole: null
    });
});

const prBuilder = new TestGitHubImportModelBuilder();
describe("GitHubPullRequest", () => {
    beforeEach(() => {
        prBuilder.reset();
        actorFactorySpy.mockClear();
    });
    describe("base properties", () => {
        it("properly initializes repository information", async () => {
            const model = prBuilder.pullRequest()
                .build();

            const prEntity = await new GitHubPullRequest().init(model);
            
            expect(prEntity.teamName).toBe("Test team");
            expect(prEntity.projectName).toBe("TestOwner");
            expect(prEntity.repositoryName).toBe("TestRepo");
        });

        it("properly initializes pull request metadata", async () => {
            const model = prBuilder.pullRequest()
                .build();

            const prEntity = await new GitHubPullRequest().init(model);
            
            expect(prEntity.pullRequestNumber).toBe(1);
            expect(prEntity.targetBranch).toBe("main");
            expect(prEntity.viewURL).toBe("https://github.com/TestOwner/TestRepo/pull/1");
        });
    });
    describe("`requestedReviewersCount`", () => {
        it("counts requested reviewers by default", async () => {
            const model = prBuilder.pullRequest().addReviewer().build();

            const prEntity = await new GitHubPullRequest().init(model);

            expect(prEntity.requestedReviewersCount).toBe(1);
        });

        it("doesn't count added and then removed reviewers", async () => {
            const model = prBuilder.pullRequest().addReviewer()
                .removeReviewer()
                .build();

            const prEntity = await new GitHubPullRequest().init(model);

            expect(prEntity.requestedReviewersCount).toBe(0);
        });

        it("but counts added and then removed reviewers who had time to submit review", async () => {
            const model = prBuilder.pullRequest().addReviewer()
                .submitReview().removeReviewer().build();

            const prEntity = await new GitHubPullRequest().init(model);

            expect(prEntity.requestedReviewersCount).toBe(1);
        });
    });

    it.each([
        { input: "OWNER", expected: ActorRole.MEMBER },
        { input: "MEMBER", expected: ActorRole.MEMBER },
        { input: "COLLABORATOR", expected: ActorRole.MEMBER },
        { input: "CONTRIBUTOR", expected: ActorRole.CONTRIBUTOR },
        { input: "FIRST_TIMER", expected: ActorRole.CONTRIBUTOR },
        { input: "FIRST_TIME_CONTRIBUTOR", expected: ActorRole.CONTRIBUTOR },
        { input: "MANNEQUIN", expected: ActorRole.UNKNOWN },
        { input: "NONE", expected: ActorRole.UNKNOWN }
    ])("`authorRole` reduces GitHub roles to MEMBER, CONTRIBUTOR or UNKNOWN", async ({ input, expected }) => {
        const model = prBuilder.pullRequest().setAuthor(input as GitHubPullRequestAuthorRole).build();

        const prEntity = await new GitHubPullRequest().init(model);

        expect(prEntity.authorRole).toBe(expected);
    });

    describe("`author`", () => {
        it("Instantiates `actor` user with ActorFactory", async () => {
            const model = prBuilder.pullRequest().authorIsBot().build();

            const prEntity = await new GitHubPullRequest().init(model);

            expect(ActorFactory.fetch).toHaveBeenCalledTimes(1);
            await expect((<any>ActorFactory.fetch).mock.results[0].value).resolves.toEqual(prEntity.author);
        });
        it("Sets `actor.is_bot_user` flag if author is marked as bot by GitHub", async () => {
            const model = prBuilder.pullRequest().authorIsBot().build();

            const prEntity = await new GitHubPullRequest().init(model);

            expect(prEntity.author.isBotUser).toBe(true);
        });
    });

    describe("`sharedForReviewDate`", () => {
        it("Is set to `createdDate` by default", async () => {
            const model = prBuilder.pullRequest().build();

            const prEntity = await new GitHubPullRequest().init(model);

            expect(prEntity.sharedForReviewDate).toEqual(prEntity.createdDate);
        });

        it("Is set to the date of the first `ready_for_review` event if any", async () => {
            const model = prBuilder.pullRequest()
                .isReadyForReview(prBuilder.prCreatedAt.add(1, "hours"))
                .isReadyForReview(prBuilder.prCreatedAt.add(3, "hours"))
                .build();

            const prEntity = await new GitHubPullRequest().init(model);

            expect(prEntity.sharedForReviewDate).toEqual(prBuilder.prCreatedAt.add(1, "hours").toDate());
        });

        it("Is set to the date of the first reviewer added if all of them were added after the PR creation", async () => {
            const model = prBuilder.pullRequest()
                .addReviewer(prBuilder.firstReviewer, prBuilder.prCreatedAt.add(1, "hours"))
                .addReviewer(prBuilder.secondReviewer, prBuilder.prCreatedAt.add(3, "hours"))
                .build();

            const prEntity = await new GitHubPullRequest().init(model);

            expect(prEntity.sharedForReviewDate).toEqual(prBuilder.prCreatedAt.add(1, "hours").toDate());
        });
    });

    describe("first and last commit dates", () => {
        it("Keeps first and last commit dates empty if there are now commits and reports integrity error about that", async () => {
            const model = prBuilder.pullRequest()
                .build();

            const prEntity = await new GitHubPullRequest().init(model);

            expect(prEntity.initialCommitDate).toBeUndefined();
            expect(prEntity.lastCommitDate).toBeUndefined();
            const integrityErrors = prEntity.validateDataIntegrity();
            expect(integrityErrors).toHaveLength(2);
            expect(integrityErrors[0]).toContain("Is that possible that pull request has no commits?");
            expect(integrityErrors[1]).toContain("Is that possible that pull request has no commits?");
        });

        it("Are set from commits history represented in activities", async () => {
            const model = prBuilder.pullRequest()
                .addCommit(prBuilder.prCreatedAt.subtract(3, "hours"))
                .addCommit(prBuilder.prCreatedAt.subtract(1, "hours"))
                .build();

            const prEntity = await new GitHubPullRequest().init(model);

            expect(prEntity.initialCommitDate).toEqual(prBuilder.prCreatedAt.subtract(3, "hours").toDate());
            expect(prEntity.lastCommitDate).toEqual(prBuilder.prCreatedAt.subtract(1, "hours").toDate());
        });
    });

    describe("`authorCommentsCount`", () => {
        it("Is set from comment activities", async () => {
            const model = prBuilder.pullRequest()
                .addComment(prBuilder.prAuthor)
                .addComment(prBuilder.prAuthor)
                .build();

            const prEntity = await new GitHubPullRequest().init(model);
            expect(prEntity.authorCommentsCount).toEqual(2);
        });
    });

    it("`diffRowsAdded` and `diffRowsDeleted` are set from pr files", async () => {
        const model = prBuilder.pullRequest()
            .addCommit(prBuilder.prCreatedAt.subtract(3, "hours"), prBuilder.prAuthor, [{
                additions: 10,
                deletions: 5,
                filename: "src/index.ts"
            }])
            .build();

        const prEntity = await new GitHubPullRequest().init(model);
        expect(prEntity.diffRowsAdded).toEqual(10);
        expect(prEntity.diffRowsDeleted).toEqual(5);
    });

    it("`testsWereTouched` is false if there are no files with `test` in path name", async () => {
        const modelWithoutTestsTouched = prBuilder.pullRequest()
            .addCommit(prBuilder.prCreatedAt.subtract(3, "hours"), prBuilder.prAuthor, [{
                additions: 10,
                deletions: 5,
                filename: "src/index.ts"
            }])
            .build();

        const prWithoutTestsTouched = await new GitHubPullRequest().init(modelWithoutTestsTouched);
        expect(prWithoutTestsTouched.testsWereTouched).toEqual(false);

    });

    it("`testsWereTouched` is true if there are files with `test` in path name", async () => {
        const modelWithTestsTouched = prBuilder.pullRequest()
            .addCommit(prBuilder.prCreatedAt.subtract(3, "hours"), prBuilder.prAuthor, [{
                additions: 10,
                deletions: 5,
                filename: "src/index.test.ts"
            }])
            .build();

        const prWithTestsTouched = await new GitHubPullRequest().init(modelWithTestsTouched);
        expect(prWithTestsTouched.testsWereTouched).toEqual(true);
    });

    describe("`participants`", () => {
        it("are those who were requested as reviewers", async () => {
            const model = prBuilder.pullRequest()
                .addReviewer(prBuilder.firstReviewer)
                .build();

            const prEntity = await new GitHubPullRequest().init(model);
            expect(prEntity.participants.map(p=>p.participant.login)).toEqual([prBuilder.firstReviewer.login]);
        });

        it("are those who are assignees", async () => {
            const model = prBuilder.pullRequest()
                .addAssignee(prBuilder.firstReviewer)
                .build();

            const prEntity = await new GitHubPullRequest().init(model);
            expect(prEntity.participants.map(p=>p.participant.login)).toEqual([prBuilder.firstReviewer.login]);
        });

        it("are those who merged the PR", async () => {
            const model = prBuilder.pullRequest()
                .merge(prBuilder.firstReviewer)
                .build();

            const prEntity = await new GitHubPullRequest().init(model);
            expect(prEntity.participants.map(p=>p.participant.login)).toEqual([prBuilder.firstReviewer.login]);
        });

        it("are those who commented the PR", async () => {
            const model = prBuilder.pullRequest()
                .addComment(prBuilder.firstReviewer)
                .build();

            const prEntity = await new GitHubPullRequest().init(model);
            expect(prEntity.participants.map(p=>p.participant.login)).toEqual([prBuilder.firstReviewer.login]);
        });

        it("are those who line-commented the PR", async () => {
            const model = prBuilder.pullRequest()
                .addLineComment(prBuilder.firstReviewer)
                .build();

            const prEntity = await new GitHubPullRequest().init(model);
            expect(prEntity.participants.map(p=>p.participant.login)).toEqual([prBuilder.firstReviewer.login]);
        });

        it("are those who reviewed the PR", async () => {
            const model = prBuilder.pullRequest()
                .submitReview(prBuilder.firstReviewer)
                .build();

            const prEntity = await new GitHubPullRequest().init(model);
            expect(prEntity.participants.map(p=>p.participant.login)).toEqual([prBuilder.firstReviewer.login]);
        });

        it("author is never a participant", async () => {
            const model = prBuilder.pullRequest()
                .addReviewer(prBuilder.prAuthor)
                .addAssignee(prBuilder.prAuthor)
                .addComment(prBuilder.prAuthor)
                .addLineComment(prBuilder.prAuthor)
                .submitReview(prBuilder.prAuthor)
                .merge(prBuilder.prAuthor)
                .build();

            const prEntity = await new GitHubPullRequest().init(model);
            expect(prEntity.participants.map(p=>p.participant.login)).toHaveLength(0);
        });
    });

    describe("`activities`", () => {
        it("properly initializes comment activities", async () => {
            const model = prBuilder.pullRequest()
                .addComment(prBuilder.firstReviewer)
                .build();

            const prEntity = await new GitHubPullRequest().init(model);
            const activity = prEntity.activities[0];
            
            expect(activity.what).toBe("commented");
            expect(activity.who).toBe(prBuilder.firstReviewer.login);
        });

        it("properly initializes line comment activities", async () => {
            const model = prBuilder.pullRequest()
                .addLineComment(prBuilder.firstReviewer)
                .build();

            const prEntity = await new GitHubPullRequest().init(model);
            const activity = prEntity.activities[0];
            
            expect(activity.what).toBe("commented");
            expect(activity.who).toBe(prBuilder.firstReviewer.login);
        });

        it("properly initializes review activities", async () => {
            const model = prBuilder.pullRequest()
                .submitReview(prBuilder.firstReviewer)
                .build();

            const prEntity = await new GitHubPullRequest().init(model);
            const activity = prEntity.activities[0];
            
            expect(activity.what).toBe("approved");
            expect(activity.who).toBe(prBuilder.firstReviewer.login);
        });

        it("properly initializes ready for review activities", async () => {
            const model = prBuilder.pullRequest()
                .isReadyForReview(prBuilder.prCreatedAt.add(1, "hour"))
                .build();

            const prEntity = await new GitHubPullRequest().init(model);
            const activity = prEntity.activities[0];
            
            expect(activity.what).toBe("ready_for_review");
            expect(activity.who).toBe(prBuilder.prAuthor.login);
        });

        it("properly initializes merge activities", async () => {
            const model = prBuilder.pullRequest()
                .merge(prBuilder.firstReviewer)
                .build();

            const prEntity = await new GitHubPullRequest().init(model);
            const activity = prEntity.activities[0];
            
            expect(activity.what).toBe("merged");
            expect(activity.who).toBe(prBuilder.firstReviewer.login);
        });
    });

    describe("validateDataIntegrity", () => {
        describe("commit dates validation", () => {
            it("reports error when PR has no commits", async () => {
                const model = prBuilder.pullRequest().build();
                const prEntity = await new GitHubPullRequest().init(model);
                
                const errors = prEntity.validateDataIntegrity();
                
                expect(errors).toContainEqual(expect.stringContaining("Is that possible that pull request has no commits?"));
            });

            it("reports error when initial commit date is after last commit date", async () => {
                const model = prBuilder.pullRequest()
                    .addCommit(prBuilder.prCreatedAt.subtract(3, "hours"))
                    .build();
                
                // Force initialCommitDate to be after lastCommitDate
                const prEntity = await new GitHubPullRequest().init(model);
                prEntity.initialCommitDate = new Date(prEntity.lastCommitDate!.getTime() + 1000);
                
                const errors = prEntity.validateDataIntegrity();
                
                expect(errors).toContainEqual(expect.stringContaining("`initialCommitDate` is bigger than `lastCommitDate`"));
            });

            it("reports error when commits are after merge date", async () => {
                const model = prBuilder.pullRequest()
                    .addCommit(prBuilder.prCreatedAt.add(4, "hours"))
                    .merge(prBuilder.firstReviewer, prBuilder.prCreatedAt.add(3, "hours"))
                    .build();
                const prEntity = await new GitHubPullRequest().init(model);
                
                const errors = prEntity.validateDataIntegrity();
                
                expect(errors).toContainEqual(expect.stringContaining("`lastCommitDate` is bigger than `mergedDate`"));
            });
        });

        describe("date sequence validation", () => {
            it("reports error when created date is after updated date", async () => {
                const model = prBuilder.pullRequest()
                    .build();
                model.pullRequest.updated_at = prBuilder.prCreatedAt.subtract(1, "day").toISOString();
                const prEntity = await new GitHubPullRequest().init(model);
                
                const errors = prEntity.validateDataIntegrity();
                
                expect(errors).toContainEqual(expect.stringContaining("`createdDate` is bigger than `updatedDate`"));
            });

            it("reports error when created date is after shared for review date", async () => {
                const model = prBuilder.pullRequest()
                    .isReadyForReview(prBuilder.prCreatedAt.subtract(1, "hour"))
                    .build();
                const prEntity = await new GitHubPullRequest().init(model);
                
                const errors = prEntity.validateDataIntegrity();
                
                expect(errors).toContainEqual(expect.stringContaining("`createdDate` is bigger than `sharedForReviewDate`"));
            });

            it("reports error when shared for review date is after merge date", async () => {
                const model = prBuilder.pullRequest()
                    .isReadyForReview(prBuilder.prCreatedAt.add(4, "hours"))
                    .merge(prBuilder.firstReviewer, prBuilder.prCreatedAt.add(3, "hours"))
                    .build();
                const prEntity = await new GitHubPullRequest().init(model);
                
                const errors = prEntity.validateDataIntegrity();
                
                expect(errors).toContainEqual(expect.stringContaining("`sharedForReviewDate` is bigger than `mergedDate`"));
            });

            it("reports error when created date is after merged date", async () => {
                const model = prBuilder.pullRequest()
                    .merge(prBuilder.firstReviewer, prBuilder.prCreatedAt.subtract(1, "hour"))
                    .build();
                const prEntity = await new GitHubPullRequest().init(model);
                
                const errors = prEntity.validateDataIntegrity();
                
                expect(errors).toContainEqual(expect.stringContaining("`createdDate` is bigger than `mergedDate`"));
            });

            it("reports error when initial commit date is after merged date", async () => {
                const model = prBuilder.pullRequest()
                    .addCommit(prBuilder.prCreatedAt.add(4, "hours"))
                    .merge(prBuilder.firstReviewer, prBuilder.prCreatedAt.add(3, "hours"))
                    .build();
                const prEntity = await new GitHubPullRequest().init(model);
                
                const errors = prEntity.validateDataIntegrity();
                
                expect(errors).toContainEqual(expect.stringContaining("`initialCommitDate` is bigger than `mergedDate`"));
            });
        });

        describe("participant dates validation", () => {
            it("reports error when participant's first comment is before PR creation", async () => {
                const model = prBuilder.pullRequest()
                    .addComment(prBuilder.firstReviewer, prBuilder.prCreatedAt.subtract(1, "hour"))
                    .build();
                const prEntity = await new GitHubPullRequest().init(model);
                
                const errors = prEntity.validateDataIntegrity();
                
                expect(errors).toContainEqual(expect.stringContaining("`participant.firstCommentDate` is less than `pullRequest.createdDate`"));
            });

            it("reports error when participant's first approval is before PR shared for review", async () => {
                const model = prBuilder.pullRequest()
                    .isReadyForReview(prBuilder.prCreatedAt.add(2, "hours"))
                    .submitReview(prBuilder.firstReviewer, prBuilder.prCreatedAt.add(1, "hours"))
                    .build();
                const prEntity = await new GitHubPullRequest().init(model);
                
                const errors = prEntity.validateDataIntegrity();
                
                expect(errors).toContainEqual(expect.stringContaining("`participant.firstApprovalDate` is less than `pullRequest.sharedForReviewDate`"));
            });

            it("reports error when participant's first review is before PR shared for review", async () => {
                const model = prBuilder.pullRequest()
                    .isReadyForReview(prBuilder.prCreatedAt.add(2, "hours"))
                    .submitReview(prBuilder.firstReviewer, prBuilder.prCreatedAt.add(1, "hours"))
                    .build();
                const prEntity = await new GitHubPullRequest().init(model);
                
                const errors = prEntity.validateDataIntegrity();
                
                expect(errors).toContainEqual(expect.stringContaining("`participant.firstReviewDate` is less than `pullRequest.sharedForReviewDate`"));
            });

            it("reports error when participant's last comment is before PR shared for review (unless bot)", async () => {
                const model = prBuilder.pullRequest()
                    .isReadyForReview(prBuilder.prCreatedAt.add(2, "hours"))
                    .addComment(prBuilder.firstReviewer, prBuilder.prCreatedAt.add(1, "hours"))
                    .build();
                const prEntity = await new GitHubPullRequest().init(model);
                
                const errors = prEntity.validateDataIntegrity();
                
                expect(errors).toContainEqual(expect.stringContaining("`participant.lastCommentDate` is less than `pullRequest.sharedForReviewDate`"));
            });

            it("does not report error for bot comments before PR shared for review", async () => {
                const botReviewer: GitHubUserModel = {
                    id: prBuilder.firstReviewer.id,
                    login: prBuilder.firstReviewer.login,
                    type: "Bot",
                    html_url: prBuilder.firstReviewer.html_url
                };
                const model = prBuilder.pullRequest()
                    .isReadyForReview(prBuilder.prCreatedAt.add(2, "hours"))
                    .addComment(botReviewer, prBuilder.prCreatedAt.add(1, "hours"))
                    .build();
                const prEntity = await new GitHubPullRequest().init(model);
                
                const errors = prEntity.validateDataIntegrity();
                
                expect(errors).not.toContainEqual(expect.stringContaining("`participant.lastCommentDate` is less than `pullRequest.sharedForReviewDate`"));
            });

            it("reports error when first comment date is after last comment date", async () => {
                const model = prBuilder.pullRequest()
                    .addComment(prBuilder.firstReviewer, prBuilder.prCreatedAt.add(2, "hours"))
                    .build();
                const prEntity = await new GitHubPullRequest().init(model);
                const participant = prEntity.participants[0];
                participant.firstCommentDate = new Date(participant.lastCommentDate!.getTime() + 1000);
                
                const errors = prEntity.validateDataIntegrity();
                
                expect(errors).toContainEqual(expect.stringContaining("`participant.firstCommentDate` is bigger than `participant.lastCommentDate`"));
            });

            it("reports error when first approval date is after last approval date", async () => {
                const model = prBuilder.pullRequest()
                    .submitReview(prBuilder.firstReviewer, prBuilder.prCreatedAt.add(2, "hours"))
                    .build();
                const prEntity = await new GitHubPullRequest().init(model);
                const participant = prEntity.participants[0];
                participant.firstApprovalDate = new Date(participant.lastApprovalDate!.getTime() + 1000);
                
                const errors = prEntity.validateDataIntegrity();
                
                expect(errors).toContainEqual(expect.stringContaining("`participant.firstApprovalDate` is bigger than `participant.lastApprovalDate`"));
            });

            it("reports error when last approval date is before created date", async () => {
                const model = prBuilder.pullRequest()
                    .submitReview(prBuilder.firstReviewer, prBuilder.prCreatedAt.subtract(1, "hour"))
                    .build();
                const prEntity = await new GitHubPullRequest().init(model);
                
                const errors = prEntity.validateDataIntegrity();
                
                expect(errors).toContainEqual(expect.stringContaining("`participant.lastApprovalDate` is less than `pullRequest.createdDate`"));
            });

            it("reports error when last approval date is before shared for review date", async () => {
                const model = prBuilder.pullRequest()
                    .isReadyForReview(prBuilder.prCreatedAt.add(2, "hours"))
                    .submitReview(prBuilder.firstReviewer, prBuilder.prCreatedAt.add(1, "hours"))
                    .build();
                const prEntity = await new GitHubPullRequest().init(model);
                
                const errors = prEntity.validateDataIntegrity();
                
                expect(errors).toContainEqual(expect.stringContaining("`participant.lastApprovalDate` is less than `pullRequest.sharedForReviewDate`"));
            });

            it("reports error when last approval date is after merged date", async () => {
                const model = prBuilder.pullRequest()
                    .merge(prBuilder.firstReviewer, prBuilder.prCreatedAt.add(2, "hours"))
                    .submitReview(prBuilder.firstReviewer, prBuilder.prCreatedAt.add(3, "hours"))
                    .build();
                const prEntity = await new GitHubPullRequest().init(model);
                
                const errors = prEntity.validateDataIntegrity();
                
                expect(errors).toContainEqual(expect.stringContaining("`participant.lastApprovalDate` is bigger than `mergedDate`"));
            });

            it("reports error when participant's first review date is after last approval date", async () => {
                const model = prBuilder.pullRequest()
                    .submitReview(prBuilder.firstReviewer, prBuilder.prCreatedAt.add(2, "hours"))
                    .build();
                const prEntity = await new GitHubPullRequest().init(model);
                const participant = prEntity.participants[0];
                participant.firstReviewDate = new Date(participant.lastApprovalDate!.getTime() + 1000);
                
                const errors = prEntity.validateDataIntegrity();
                
                expect(errors).toContainEqual(expect.stringContaining("`participant.firstReviewDate` is bigger than `participant.lastApprovalDate`"));
            });
        });

        describe("requested reviewers validation", () => {
            it("reports error when requested reviewers count is negative", async () => {
                const model = prBuilder.pullRequest().build();
                const prEntity = await new GitHubPullRequest().init(model);
                prEntity.requestedReviewersCount = -1;
                
                const errors = prEntity.validateDataIntegrity();
                
                expect(errors).toContainEqual(expect.stringContaining("`requestedReviewersCount` is less than 0"));
            });
        });

        it("returns empty array when all validations pass", async () => {
            const model = prBuilder.pullRequest()
                .addCommit(prBuilder.prCreatedAt.subtract(3, "hours"))
                .addCommit(prBuilder.prCreatedAt.subtract(1, "hours"))
                .isReadyForReview(prBuilder.prCreatedAt.add(1, "hours"))
                .addComment(prBuilder.firstReviewer, prBuilder.prCreatedAt.add(2, "hours"))
                .submitReview(prBuilder.firstReviewer, prBuilder.prCreatedAt.add(2.5, "hours"))
                .merge(prBuilder.firstReviewer, prBuilder.prCreatedAt.add(3, "hours"))
                .build();
            const prEntity = await new GitHubPullRequest().init(model);
            
            const errors = prEntity.validateDataIntegrity();
            
            expect(errors).toHaveLength(0);
        });
    });
});

