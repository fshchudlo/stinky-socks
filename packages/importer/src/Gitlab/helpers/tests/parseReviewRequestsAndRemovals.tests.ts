import { parseReviewRequestsAndRemovals } from "../parseReviewRequestsAndRemovals";

describe("parseReviewRequestsAndRemovals", () => {
    it("parses only added reviewers", () => {
        const note = "requested review from @alice and @bob";
        expect(parseReviewRequestsAndRemovals(note)).toEqual({
            added: ["alice", "bob"],
            removed: []
        });
    });

    it("parses only removed reviewers", () => {
        const note = "removed review request for @charlie and @dave";
        expect(parseReviewRequestsAndRemovals(note)).toEqual({
            added: [],
            removed: ["charlie", "dave"]
        });
    });

    it("parses both added and removed reviewers", () => {
        const note =
            "requested review from @alice and removed review request for @bob and @mike";
        expect(parseReviewRequestsAndRemovals(note)).toEqual({
            added: ["alice"],
            removed: ["bob", "mike"]
        });
    });

    it("returns empty arrays for empty string", () => {
        expect(parseReviewRequestsAndRemovals("")).toEqual({
            added: [],
            removed: []
        });
    });

    it("handles single user correctly", () => {
        const note = "requested review from @alice";
        expect(parseReviewRequestsAndRemovals(note)).toEqual({
            added: ["alice"],
            removed: []
        });
    });

    it("handles both commas and 'and' statements", () => {
        const note = "requested review from @alice, @bob, and @mike and removed review request for @charlie and @dave";
        expect(parseReviewRequestsAndRemovals(note)).toEqual({
            added: ["alice", "bob", "mike"],
            removed: ["charlie", "dave"]
        });
    });
});