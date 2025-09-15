import { PullRequestActivity, PullRequestActivityType } from "../../MetricsDB/entities/PullRequestActivity";
import { GitlabProjectModel, GitlabPullRequestModel } from "../GitlabAPI.contracts";

export class GitlabPullRequestActivity extends PullRequestActivity {
    constructor(teamName: string,
                repository: GitlabProjectModel,
                pullRequestData: GitlabPullRequestModel,
                what: PullRequestActivityType,
                when: Date,
                who: string,
                description: string | null,
                viewURL: string | null) {
        super();
        this.teamName = teamName;
        this.projectName = repository.namespace.name;
        this.repositoryName = repository.name;
        this.pullRequestNumber = pullRequestData.iid;

        this.what = what;
        this.when = when;
        this.who = who;
        this.description = description?.replace(/\x00/g, "") || null;
        this.viewURL = viewURL;
    }
}