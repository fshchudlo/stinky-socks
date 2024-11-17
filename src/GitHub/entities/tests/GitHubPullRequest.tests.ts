import { GitHubPullRequest } from "../GitHubPullRequest";
import { ActorFactory } from "../../../MetricsDB/ActorFactory";
import { TestPRsBuilder } from "./TestPRsBuilder";

describe("GitHubPullRequest", () => {
    it("Should map basic fields", async () => {
        jest.spyOn(ActorFactory, "fetch").mockImplementation(async ({ teamName, login, isBotUser }: {
            teamName: string,
            login: string,
            isBotUser: boolean
        }) => {
            return Promise.resolve({
                id: 1,
                login: login,
                teamName: teamName,
                nickname: `${login} nickname`,
                isBotUser: isBotUser,
                isFormerParticipant: false,
                duplicates: [],
                participations: [],
                pullRequests:[],
                teamRole: null
            });
        });
        const model = new TestPRsBuilder().pullRequest();

        const pullRequestEntity = await new GitHubPullRequest().init(model);
        expect(pullRequestEntity).toMatchSnapshot();
    });
});

