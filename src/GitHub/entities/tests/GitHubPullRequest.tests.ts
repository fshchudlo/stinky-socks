import { GitHubPullRequest } from "../GitHubPullRequest";
import { ActorFactory } from "../../../MetricsDB/ActorFactory";
import { TestGitHubImportModelBuilder } from "./TestGitHubImportModelBuilder";
import dayjs from "dayjs";
import { ActorRole } from "../../../MetricsDB/entities/ActorRole";
import { GitHubPullRequestAuthorRole } from "../../GitHubAPI.contracts";

let fetchCallsCounter = 0;
jest.spyOn(ActorFactory, "fetch").mockImplementation(async ({ teamName, login, isBotUser }: {
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
    });

    it("Should map basic fields", async () => {
        const model = prBuilder.pullRequest(prBuilder.prAuthor, dayjs("2024-11-19T22:10:19")).build();

        const prEntity = await new GitHubPullRequest().init(model);

        expect(prEntity).toMatchSnapshot();
    });

    it("`requestedReviewersCount` counts requested reviewer", async () => {
        const model = prBuilder.pullRequest().addReviewer().build();

        const prEntity = await new GitHubPullRequest().init(model);

        expect(prEntity.requestedReviewersCount).toBe(1);
    });

    it("`requestedReviewersCount` doesn't count requested and then removed reviewer", async () => {
        const model = prBuilder.pullRequest().addReviewer()
            .removeReviewer()
            .build();

        const prEntity = await new GitHubPullRequest().init(model);

        expect(prEntity.requestedReviewersCount).toBe(0);
    });

    it("`requestedReviewersCount` counts requested and then removed reviewer if he had time to submit review", async () => {
        const model = prBuilder.pullRequest().addReviewer()
            .submitReview().removeReviewer().build();

        const prEntity = await new GitHubPullRequest().init(model);

        expect(prEntity.requestedReviewersCount).toBe(1);
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
        const model = prBuilder.pullRequest().authorIs(input as GitHubPullRequestAuthorRole).build();

        const prEntity = await new GitHubPullRequest().init(model);

        expect(prEntity.authorRole).toBe(expected);
    });

    it("Sets user's `is_bot_user` flag if author is marked as bot by GitHub", async () => {
        const model = prBuilder.pullRequest().authorIsBot().build();

        const prEntity = await new GitHubPullRequest().init(model);

        expect(prEntity.author.isBotUser).toBe(true);
    });

    it("Sets user's `is_bot_user` flag from known bots list", async () => {
        const model = prBuilder.pullRequest().addKnownBotUser(prBuilder.prAuthor.login).build();

        const prEntity = await new GitHubPullRequest().init(model);

        expect(prEntity.author.isBotUser).toBe(true);
    });

});

