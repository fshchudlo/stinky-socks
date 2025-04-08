import "dotenv/config";

export const AppConfig = {
    WEB_UI_PORT: process.env.WEB_UI_PORT || 3000,
    IS_PRODUCTION: process.env.NODE_ENV === "production",
    SESSION_SECRET: process.env.SESSION_SECRET!,
    GITHUB_APP_ID: +process.env.GITHUB_APP_ID!,
    GITHUB_APP_CLIENT_ID: process.env.GITHUB_APP_CLIENT_ID!,
    GITHUB_APP_CLIENT_SECRET: process.env.GITHUB_APP_CLIENT_SECRET!,
    GITHUB_APP_PRIVATE_KEY: process.env.GITHUB_APP_PRIVATE_KEY!.replace(
        /\\n/g,
        "\n"
    ),
    MetricsDB: {
        DB_HOST: process.env.DB_HOST!,
        DB_PORT: +process.env.DB_PORT!,
        DB_USERNAME: process.env.DB_USERNAME!,
        DB_PASSWORD: process.env.DB_PASSWORD!,
        DB_NAME: process.env.DB_NAME!
    }
};
