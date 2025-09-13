import "dotenv/config";

export const gitlabProjectsImportConfig = {
    url: process.env.GITLAB_INSTANCE_URL as string,
    apiToken: process.env.GITLAB_API_TOKEN as string,
    namespaceSearch: (process.env.GITLAB_NAMESPACES_SEARCH || undefined) as string | undefined
};
