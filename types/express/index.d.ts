import 'express';

declare module 'express-serve-static-core' {
    interface Request {
        user?: {
            repositories: Array<string>;
            username: string;
        }
    }
}