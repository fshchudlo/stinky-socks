import {Profile} from "passport-github2";
import {GitHubAPI} from "./GitHubAPI";

export type StinkySocksUserProfile = Express.User & Profile & {
    repositories: Array<string>;
}
export async function enrichUserSessionData(accessToken: string, refreshToken: string, githubProfile: StinkySocksUserProfile, done: any) {
    try {
        const repositories = await GitHubAPI.getUserRepositories(accessToken);

        githubProfile.repositories = repositories.map((r: any) => r.full_name);

        return done(null, githubProfile);
    } catch (error) {
        return done(error);
    }
}
