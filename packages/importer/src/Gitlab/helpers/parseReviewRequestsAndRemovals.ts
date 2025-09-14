export function parseReviewRequestsAndRemovals(body: string) {
    const added: string[] = [];
    const removed: string[] = [];

    if (!body) return { added, removed };

    // split on commas or the word "and", optionally surrounded by spaces
    const splitUsers = (text: string) =>
        text
            .split(/\s*(?:,|and)\s*/i)          // split on "," or "and"
            .map(u => u.trim()
                .replace(/^@/, "")
                .replace(/[,]$/, ""))// drop trailing comma if any
            .filter(un=>!!un);

    // match "requested review from <users>" stopping if " and removed" follows
    const addedMatch = body.match(/requested review from (.+?)(?: and removed|$)/i);
    if (addedMatch) {
        added.push(...splitUsers(addedMatch[1]));
    }

    // match "removed review request for <users>" at the end of the line
    const removedMatch = body.match(/removed review request for (.+)$/i);
    if (removedMatch) {
        removed.push(...splitUsers(removedMatch[1]));
    }

    return { added, removed };
}