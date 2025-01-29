import "dotenv/config";
import {MetricsDB} from "../../MetricsDB/MetricsDB";
import {ActorFactory} from "../../MetricsDB/ActorFactory";
import {GitHubAPI} from "../api/GitHubAPI";
import {GitHubPullRequest} from "../entities/GitHubPullRequest";
import {publicProjectsImportConfig} from "../../publicProjectsImportConfig";
import {PersonalTokensRotator} from "../api/PersonalTokensRotator";

describe("Import single PR debug helper", () => {
    it.skip("Create PR entity", async () => {
        await MetricsDB.initialize();
        await ActorFactory.preloadCacheByTeam("kubernetes");

        const tokensRotator = new PersonalTokensRotator(publicProjectsImportConfig.gitHubApiTokens);
        const gitHubAPI = new GitHubAPI(tokensRotator);

        const [pullRequest, activities, files] = await Promise.all([
            gitHubAPI.getPullRequest("kubernetes", "kubernetes", 6339),
            gitHubAPI.getPullRequestActivities("kubernetes", "kubernetes", 6339),
            gitHubAPI.getPullRequestFiles("kubernetes", "kubernetes", 6339)
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
