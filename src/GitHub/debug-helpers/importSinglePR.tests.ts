import "dotenv/config";
import {MetricsDB} from "../../MetricsDB/MetricsDB";
import {ActorFactory} from "../../MetricsDB/ActorFactory";
import {GitHubAPI} from "../api/GitHubAPI";
import {GitHubPullRequest} from "../entities/GitHubPullRequest";
import {fetchNextTokenHeader} from "../api/GitHubTokenCredentialsHelper";
import {publicProjectsImportConfig} from "../../publicProjectsImportConfig";
import {checkAPIRateLimits} from "../api/checkAPIRateLimits";

describe("Import single PR debug helper", () => {
    it.skip("Create PR entity", async () => {
        await MetricsDB.initialize();
        await ActorFactory.preloadCacheByTeam("grafana");

        const gitHubAPI = new GitHubAPI({
            getAuthHeader: async () => await fetchNextTokenHeader(publicProjectsImportConfig.gitHubApiTokens),
            checkAPIRateLimits: checkAPIRateLimits
        });

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
