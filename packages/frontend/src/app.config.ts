import "dotenv/config";

export const AppConfig = {
    IS_PRODUCTION: process.env.NODE_ENV === "production",
    SESSION_SECRET: process.env.SESSION_SECRET!,
    GITHUB_APP_ID: +process.env.GITHUB_APP_ID!,
    GITHUB_APP_CLIENT_ID: process.env.GITHUB_APP_CLIENT_ID!,
    GITHUB_APP_CLIENT_SECRET: process.env.GITHUB_APP_CLIENT_SECRET!,
    GITHUB_APP_PRIVATE_KEY: process.env.GITHUB_APP_PRIVATE_KEY!.replace(
        /\\n/g,
        "\n"
    )
};
