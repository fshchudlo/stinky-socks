export function convertMillisecondsToHumanReadableTime(milliseconds: number): string {
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