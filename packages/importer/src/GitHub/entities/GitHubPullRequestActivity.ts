import { PullRequestActivity, PullRequestActivityType } from "../../MetricsDB/entities/PullRequestActivity";
import { GitHubPullRequestModel } from "../GitHubAPI.contracts";

export class GitHubPullRequestActivity extends PullRequestActivity {
    constructor(teamName: string, pullRequestData: GitHubPullRequestModel, what: PullRequestActivityType, when: Date, who: string, description: string | null, viewURL: string | null) {
        super();
        this.teamName = teamName;
        this.projectName = pullRequestData.base.repo.owner.login;
        this.repositoryName = pullRequestData.base.repo.name;
        this.pullRequestNumber = pullRequestData.number;
        this.what = what;
        this.when = when;
        this.who = who;
        this.description = description?.replace(/\x00/g, '') || null;
        this.viewURL = viewURL;
    }
}