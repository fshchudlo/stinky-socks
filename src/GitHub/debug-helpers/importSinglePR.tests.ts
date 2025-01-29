import "dotenv/config";
import {MetricsDB} from "../../MetricsDB/MetricsDB";
import {ActorFactory} from "../../MetricsDB/ActorFactory";
import {GitHubAPI} from "../api/GitHubAPI";
import {GitHubPullRequest} from "../entities/GitHubPullRequest";
import {fetchNextTokenHeader} from "../api/GitHubTokenCredentialsHelper";

describe("Import single PR debug helper", () => {
    it.skip("Create PR entity", async () => {
        await MetricsDB.initialize();
        await ActorFactory.preloadCacheByTeam("grafana");

        const gitHubAPI = new GitHubAPI(async () => await fetchNextTokenHeader((process.env.GITHUB_PUBLIC_API_TOKENS as string).split(' ')));

        const [pullRequest, activities, files] = await Promise.all([
            gitHubAPI.getPullRequest("grafana", "grafana", 4131),
            gitHubAPI.getPullRequestActivities("grafana", "grafana", 4131),
            gitHubAPI.getPullRequestFiles("grafana", "grafana", 4131)
        ]);
        const pullRequestEntity = await new GitHubPullRequest().init({
                teamName: "grafana",
                pullRequest,
                activities,
                files
            }
        );
        expect(pullRequestEntity).not.toBeFalsy();
    });
});
