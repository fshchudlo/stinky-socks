import {GitHubCredentialsEmitter} from "./GitHubCredentialsEmitter";
import {AxiosResponse} from "axios";

const rateLimitLocks: { [key: string]: boolean; } = {};

export class InstallationTokensEmitter implements GitHubCredentialsEmitter {
    constructor(private readonly appId: number,
                private readonly privateKey: string,
                private readonly organizationId: number) {
    }

    async getAuthHeader() {
        return await fetchInstallationTokenHeader(
            this.appId,
            this.privateKey,
            this.organizationId
        );
    }

    async checkAPIRateLimits(response: AxiosResponse<any>, authHeader: string, reserveRequestsNumber = 10): Promise<void> {
        if (parseInt(response.headers["x-ratelimit-remaining"], 10) <= reserveRequestsNumber) {
            const resetTime = parseInt(response.headers["x-ratelimit-reset"], 10) * 1000;
            // Add ten more seconds to ensure we didn't violate the rate limit
            const waitTime = 10000 + resetTime - Date.now();

            // We run requests in parallel, and it's possible that a request was blocked because this check was triggered by another request.
            // By the time it resumes execution, the rate limit may have already reset.
            // To avoid redundant waiting, we recheck the actual wait time, as it represents an absolute value.
            if (waitTime <= 0 || rateLimitLocks[authHeader]) {
                return;
            }

            console.log(`🫸 The GitHub API rate limit exceeded. Waiting for ${convertMillisecondsToHumanReadableTime(waitTime)}...`);
            rateLimitLocks[authHeader] = true;
            await new Promise(resolve => setTimeout(resolve, waitTime)).finally(() => rateLimitLocks[authHeader] = false);
            console.log(`💃 The GitHub API rate limit is updated. Let's move on...`);
        }
    }
}

import jwt from "jsonwebtoken";
import axios from "axios";
import { createCache } from "cache-manager";
import {convertMillisecondsToHumanReadableTime} from "./convertMillisecondsToHumanReadableTime";

type AppInstallation = {
    installationId: number;
    organizationId: number;
    organizationLogin: string;
    permissions: {
        members?: "read";
        issues?: "read";
        contents?: "read";
        pullRequests?: "read";
    };
};

/*
 * GitHub installation-level tokens are valid for 1 hour
 * Cache for 59 minutes to avoid on-the-fly token expiration
 */
const organizationTokensCache: ReturnType<typeof createCache> = createCache({
    ttl: 59 * 60 * 1000
});

export function fetchInstallationTokenHeader(
    appId: number,
    privateKey: string,
    organizationId: number
) {
    return organizationTokensCache.wrap<string>(
        `organizationTokens:${organizationId}`,
        async () => {
            const appInstallation = await fetchAppInstallation(
                appId,
                privateKey,
                organizationId
            );
            if (!appInstallation) {
                throw new Error(
                    `No installation found for organization ${organizationId}`
                );
            }
            const jwtToken = await fetchAppJWTToken(appId, privateKey);
            const url = `https://api.github.com/app/installations/${appInstallation.installationId}/access_tokens`;
            const response = await axios.post(
                url,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${jwtToken}`,
                        Accept: "application/vnd.github.v3+json"
                    }
                }
            );
            return `Bearer ${response.data.token}`;
        }
    );
}

const appInstallationsCache: ReturnType<typeof createCache> = createCache();

function fetchAppInstallation(
    appId: number,
    privateKey: string,
    organizationId: number
) {
    return appInstallationsCache.wrap(
        `appInstallations:${organizationId}`,
        async () => {
            const installations = await getAppInstallations(appId, privateKey);
            return installations.find(i => i.organizationId === organizationId);
        }
    );
}

/*
 * GitHub App JWT tokens are valid for 10 minutes
 * Cache for 9 minutes to avoid on-the-fly token expiration
 */
const jwtTokenCacheCache: ReturnType<typeof createCache> = createCache({
    ttl: 9 * 60 * 1000
});

async function fetchAppJWTToken(appId: number, privateKey: string) {
    return await jwtTokenCacheCache.wrap<string>(`jwtToken:${appId}`, () => {
        const payload = {
            iss: appId,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 10 * 60 // JWT expires after 10 minutes
        };
        return jwt.sign(payload, privateKey, { algorithm: "RS256" });
    });
}

export async function getAppInstallations(appId: number, privateKey: string): Promise<AppInstallation[]> {
    const jwtToken = await fetchAppJWTToken(appId, privateKey);
    const url = "https://api.github.com/app/installations";
    const response = await axios.get(url, {
        headers: {
            Authorization: `Bearer ${jwtToken}`,
            Accept: "application/vnd.github.v3+json"
        }
    });

    if (response.status !== 200) {
        throw new Error(
            `An error occurred while initializing app installations cache: ${response.statusText}`
        );
    }
    return response.data.map((i: any) => {
        return <AppInstallation>{
            installationId: i.id,
            organizationId: i.account.id,
            organizationLogin: i.account.login,
            permissions: {
                issues: i.permissions.issues,
                members: i.permissions.members,
                contents: i.permissions.contents,
                pullRequests: i.permissions.pull_requests
            }
        };
    });
}