import {GitHubCredentialsEmitter} from "./GitHubCredentialsEmitter";
import {AxiosResponse} from "axios";
import {createCache} from "cache-manager";
import {convertMillisecondsToHumanReadableTime} from "./convertMillisecondsToHumanReadableTime";

const tokenRefreshDates: ReturnType<typeof createCache> = createCache({});


export class PersonalTokensRotator implements GitHubCredentialsEmitter {
    constructor(private readonly tokens: string[]) {
    }

    async getAuthHeader(): Promise<string> {
        const tokensWithDates = await Promise.all(
            this.tokens.map(async t => ({
                token: t,
                refreshTimestamp: await tokenRefreshDates.get<number>(this.getHeaderValue(t)) || null
            }))
        );

        const nextTokenToUse = tokensWithDates.reduce((min, current) => {
            if (min === null) {
                return current;
            }
            if (min.refreshTimestamp === null) {
                return min;
            }
            return current.refreshTimestamp === null || min.refreshTimestamp > current.refreshTimestamp ? current : min;
        });

        if (nextTokenToUse.refreshTimestamp !== null) {
            const waitTime = nextTokenToUse.refreshTimestamp - Date.now();

            console.log(`🫸 The GitHub API rate limit exceeded. Waiting for ${convertMillisecondsToHumanReadableTime(waitTime)}...`);
            await new Promise(resolve => setTimeout(resolve, waitTime < 0 ? 0 : waitTime));
            console.log(`💃 The GitHub API rate limit is updated. Let's move on...`);
        }
        return Promise.resolve(this.getHeaderValue(nextTokenToUse.token));
    }

    async checkAPIRateLimits(response: AxiosResponse<any>, authHeader: string, reserveRequestsNumber: number): Promise<void> {
        if (parseInt(response.headers["x-ratelimit-remaining"], 10) <= reserveRequestsNumber) {
            const resetTime = parseInt(response.headers["x-ratelimit-reset"], 10) * 1000;

            // Add ten more seconds to ensure we didn't violate the rate limit
            const waitTime = 10000 + resetTime - Date.now();

            await tokenRefreshDates.set(authHeader, resetTime, waitTime);
        }
    }

    private getHeaderValue(token: string) {
        return `token ${token}`;
    }
}