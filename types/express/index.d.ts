declare global {
    namespace Express {
        interface User {
            repositories: Array<string>;
            username: string;
        }
    }
}

export {};
