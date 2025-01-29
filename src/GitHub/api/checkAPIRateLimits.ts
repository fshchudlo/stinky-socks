import {AxiosResponse} from "axios";
const rateLimitLocks: { [key: string]: boolean; } = {};

export async function checkAPIRateLimits(response: AxiosResponse<any>, authHeader: string, reserveRequestsNumber = 10) {
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

    function convertMillisecondsToHumanReadableTime(milliseconds: number): string {
        let seconds = milliseconds / 1000;
        const units: [string, number][] = [
            ["hour", 3600],
            ["minute", 60],
            ["second", 1]
        ];

        const parts: string[] = [];

        for (const [unitName, unitSeconds] of units) {
            const unitValue = Math.floor(seconds / unitSeconds);
            if (unitValue > 0) {
                parts.push(`${unitValue} ${unitName}${unitValue > 1 ? "s" : ""}`);
            }
            seconds %= unitSeconds;
        }

        return parts.join(", ");
    }
}