import { GitlabPullRequestActivityModel } from "../../GitlabAPI.contracts";
import { ActivityTraits } from "./ActivityTraits";

export function getCommentsTimestamps(comments: GitlabPullRequestActivityModel[]) {
    return comments
        .filter(ActivityTraits.isCommentedEvent)
        .map(c => new Date(c.created_at).getTime());
}