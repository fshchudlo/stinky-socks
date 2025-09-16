import { ImportParams } from "../ImportParams";
import { GitlabAPI } from "../../api/GitlabAPI";
import {
    GitlabPullRequestActivityModel,
    GitlabPullRequestReviewRequestedActivityModel, GitlabUserModel
} from "../../GitlabAPI.contracts";
import { parseReviewRequestsAndRemovals } from "../../helpers/parseReviewRequestsAndRemovals";

export default async function normalizeGitlabPayload(params: ImportParams, gitlabAPI: GitlabAPI) {
    params.pullRequest.author = await gitlabAPI.fetchUserData(params.pullRequest.author.username);
    params.pullRequest.merged_by = await gitlabAPI.fetchUserData(params.pullRequest.merged_by.username);

    await normalizeUserArray(params.pullRequest.reviewers, gitlabAPI);
    await normalizeUserArray(params.pullRequest.assignees, gitlabAPI);

    for (const activity of params.activities) {
        activity.author = await gitlabAPI.fetchUserData(activity.author.username);
        await normalizeReviewRequestNote(activity, gitlabAPI);
    }

    return params;
}
async function normalizeReviewRequestNote(activity: GitlabPullRequestActivityModel, gitlabAPI: GitlabAPI) {
    const { added, removed } = parseReviewRequestsAndRemovals(activity.body);
    if (added?.length == 0 && removed?.length == 0) {
        return activity;
    }
    for (const addedUser of added) {
        const act = activity as GitlabPullRequestReviewRequestedActivityModel;
        act.added_reviewers ??= [];
        act.added_reviewers.push(await gitlabAPI.fetchUserData(addedUser));
    }
    for (const removedUser of removed) {
        const act = activity as GitlabPullRequestReviewRequestedActivityModel;
        act.removed_reviewers ??= [];
        act.removed_reviewers.push(await gitlabAPI.fetchUserData(removedUser));
    }
    return activity;
}

async function normalizeUserArray(users: GitlabUserModel[], gitlabAPI: GitlabAPI) {
    for (let i = 0; i < users.length; i++) {
        users[i] = await gitlabAPI.fetchUserData(users[i].username);
    }
}