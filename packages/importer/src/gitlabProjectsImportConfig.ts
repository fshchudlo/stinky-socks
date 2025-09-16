import "dotenv/config";
import { GitlabProjectModel, GitlabPullRequestModel } from "./Gitlab/GitlabAPI.contracts";

export const gitlabProjectsImportConfig = {
    url: process.env.GITLAB_INSTANCE_URL as string,
    apiToken: process.env.GITLAB_API_TOKEN as string,
    namespaceSearch: (process.env.GITLAB_NAMESPACES_SEARCH || undefined) as string | undefined,
    resolveTeamName: (project: GitlabProjectModel, pr: GitlabPullRequestModel): string => {
        {
            const monitoringTeamUserIds = [980, 25, 142, 318, 581, 66, 210];
            if (monitoringTeamUserIds.includes(pr.author.id)) {
                return "monitoring";
            }
        }
        {
            const alollyTeamUserIds = [23, 369, 168, 45, 259];
            if (alollyTeamUserIds.includes(pr.author.id)) {
                return "alolly";
            }
        }
        {
            const teploTeamUserIds = [390, 356, 412, 353];
            if (teploTeamUserIds.includes(pr.author.id)) {
                return "teplo";
            }
        }
        return project.namespace.name;
    }
};
