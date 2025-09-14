import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import {
    GitlabFileDiffModel,
    GitlabNamespaceModel,
    GitlabProjectModel,
    GitlabPullRequestActivityModel,
    GitlabPullRequestCommitModel,
    GitlabPullRequestModel
} from "../GitlabAPI.contracts";
import { createCache } from "cache-manager";

const usersCache: ReturnType<typeof createCache> = createCache();

export class GitlabAPI {
    private readonly apiClient: AxiosInstance;

    constructor(apiUrl: string, private token: string) {
        this.apiClient = axios.create({
            baseURL: apiUrl
        });
    }

    async getNamespaces(search: string | undefined = undefined) {
        const params = {
            membership: true,
            search: search
        };

        return await this.getFullList<GitlabNamespaceModel>("/namespaces", params);
    }

    async getNamespaceProjects(namespaceId: number) {
        return await this.getFullList<GitlabProjectModel>(`groups/${namespaceId}/projects`);
    }

    async getMergedMergeRequests(projectId: number, pageNumber: number, pageSize: number) {
        const url = `/projects/${projectId}/merge_requests`;
        return (await this.get(url, {
            state: "merged",
            scope: "all",
            order_by: "updated_at",
            sort: "asc",
            page: pageNumber,
            per_page: pageSize
        })).data as GitlabPullRequestModel[];
    }

    async getMergeRequestNotes(projectId: number, mergeRequestIid: number) {
        return await this.getFullList<GitlabPullRequestActivityModel>(`/projects/${projectId}/merge_requests/${mergeRequestIid}/notes`);
    }

    async getMergeRequestCommits(projectId: number, mergeRequestIid: number) {
        return await this.getFullList<GitlabPullRequestCommitModel>(`/projects/${projectId}/merge_requests/${mergeRequestIid}/commits`);
    }

    async getMergeRequestChanges(projectId: number, mergeRequestIid: number) {
        return (await this.get(`/projects/${projectId}/merge_requests/${mergeRequestIid}/changes`)).data.changes as GitlabFileDiffModel[];
    }

    async fetchUserData(username: string) {
        return await usersCache.wrap(`gitlab.api.users.${username}`, async () => {
            const res = await this.get("/users", { username });
            if(res.data?.length != 1)
            {
                throw new Error(`Something is wrong with the user "${username}"`)
            }

            return (await this.get(`/users/${res.data[0].id}`)).data;
        });
    }

    private async getFullList<T>(url: string, params: Record<string, any> = {}): Promise<T[]> {
        let pageNumber = 1;
        const pageSize = params.per_page ?? 100;
        const result: T[] = [];

        while (true) {
            params = {
                ...params,
                per_page: pageSize,
                page: pageNumber
            };
            const response = await this.get(url, params);
            result.push(...response.data);

            const totalPages = parseInt(response.headers["x-total-pages"] || "1", 10);
            if (pageNumber >= totalPages)
                break;

            pageNumber++;
        }

        return result;
    }

    private async get(url: string, params: Record<string, any> = {}): Promise<AxiosResponse> {
        const config: AxiosRequestConfig = {
            headers: {
                "PRIVATE-TOKEN": this.token,
                "Accept": "application/json"
            },
            params: params
        };
        const response = await this.apiClient.get(url, config);

        if (response.status === 200) {
            return response;
        }
        throw new Error(`Error executing request for ${url} message: ${response.statusText}`);
    }

}