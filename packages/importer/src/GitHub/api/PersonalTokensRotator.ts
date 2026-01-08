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
                resetTimestamp: await tokenRefreshDates.get<number>(this.getHeaderValue(t)) || null
            }))
        );

        const nextTokenToUse = tokensWithDates.reduce((min, current) => {
            if (min === null) {
                return current;
            }
            if (min.resetTimestamp === null) {
                return min;
            }
            return current.resetTimestamp === null || min.resetTimestamp > current.resetTimestamp ? current : min;
        });

        if (nextTokenToUse.resetTimestamp !== null) {
            const waitTime = nextTokenToUse.resetTimestamp - Date.now();

            console.log(`🫸 The GitHub API rate limit exceeded. Waiting for ${convertMillisecondsToHumanReadableTime(waitTime)}...`);
            await new Promise(resolve => setTimeout(resolve, Math.max(0, waitTime)));
            console.log(`💃 The GitHub API rate limit is updated. Let's move on...`);
        }
        return Promise.resolve(this.getHeaderValue(nextTokenToUse.token));
    }

    async checkAPIRateLimits(response: AxiosResponse<any>, authHeader: string, reserveRequestsNumber: number): Promise<void> {
        if (parseInt(response.headers["x-ratelimit-remaining"], 10) <= reserveRequestsNumber) {
            let tokenResetTime = parseInt(response.headers["x-ratelimit-reset"], 10) * 1000;

            // Add ten more seconds to ensure we didn't violate the rate limit
            tokenResetTime+=10*1000;
            
            const cacheTtl = tokenResetTime - Date.now();
            
            console.log(`🫸 The token enriched its rate limit until ${new Date(tokenResetTime).toLocaleString()}`)

            await tokenRefreshDates.set(authHeader, tokenResetTime, cacheTtl);
        }
    }

    private getHeaderValue(token: string) {
        return `token ${token}`;
    }
}