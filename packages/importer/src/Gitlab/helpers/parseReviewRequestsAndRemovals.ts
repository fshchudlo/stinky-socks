export function parseReviewRequestsAndRemovals(body: string) {
    const added: string[] = [];
    const removed: string[] = [];

    if (!body) return { added, removed };

    // split on commas or the word "and" (as a separate word)
    const splitUsers = (text: string) =>
        text
            .split(/\s*(?:,|\band\b)\s*/i)      // split on "," or "and" as whole word
            .map(u => u.trim())
            .map(u => u.replace(/^@/, ""))      // remove leading @
            .map(u => u.replace(/[.,]$/, ""))   // strip trailing punctuation (dot/comma)
            .filter(Boolean);

    // match "requested review from <users>" stopping if " and removed" follows
    const addedMatch = body.match(/requested review from\s+(.+?)(?:\s+and removed\b|$)/i);
    if (addedMatch) {
        added.push(...splitUsers(addedMatch[1]));
    }

    // match "removed review request for <users>" at the end of the line
    const removedMatch = body.match(/removed review request for\s+(.+)$/i);
    if (removedMatch) {
        removed.push(...splitUsers(removedMatch[1]));
    }

    return { added, removed };
}