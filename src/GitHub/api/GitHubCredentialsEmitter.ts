import {AxiosResponse} from "axios";

export type GitHubCredentialsEmitter = {
    getAuthHeader():Promise<string>;
    checkAPIRateLimits(response: AxiosResponse<any>, authHeader: string, reserveRequestsNumber: number):Promise<void>;
}
