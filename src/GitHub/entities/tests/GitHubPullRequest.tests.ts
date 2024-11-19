import { GitHubPullRequest } from "../GitHubPullRequest";
import { ActorFactory } from "../../../MetricsDB/ActorFactory";
import { TestGitHubImportModelBuilder } from "./TestGitHubImportModelBuilder";
import dayjs from "dayjs";

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

const builder = new TestGitHubImportModelBuilder();
describe("GitHubPullRequest", () => {
    beforeEach(() => {
        builder.reset();
    });
    it("Should map basic fields", async () => {
        const model = builder
            .pullRequest(builder.prAuthor, dayjs("2024-11-19T22:10:19"))
            .build();

        const prEntity = await new GitHubPullRequest().init(model);

        expect(prEntity).toMatchSnapshot();
    });

    it("`requestedReviewersCount` counts requested reviewer", async () => {
        const model = builder
            .pullRequest()
            .addReviewer()
            .build();

        const prEntity = await new GitHubPullRequest().init(model);

        expect(prEntity.requestedReviewersCount).toBe(1);
    });

    it("`requestedReviewersCount` doesn't count requested and then removed reviewer", async () => {
        const model = builder
            .pullRequest()
            .addReviewer()
            .removeReviewer()
            .build();

        const prEntity = await new GitHubPullRequest().init(model);

        expect(prEntity.requestedReviewersCount).toBe(0);
    });
    it("`requestedReviewersCount` counts requested and then removed reviewer if he had time to submit review", async () => {
        const model = builder
            .pullRequest()
            .addReviewer()
            .submitReview()
            .removeReviewer()
            .build();

        const prEntity = await new GitHubPullRequest().init(model);

        expect(prEntity.requestedReviewersCount).toBe(1);
    });
});

