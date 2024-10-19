import "dotenv/config";

export const AppConfig = {
    IS_PRODUCTION: process.env.NODE_ENV === "production",
    MetricsDB: {
        DB_HOST: process.env.DB_HOST,
        DB_PORT: +(process.env.DB_PORT ?? 5432),
        DB_PASSWORD: process.env.DB_PASSWORD,
        DB_USERNAME: process.env.DB_USERNAME,
        DB_NAME: process.env.DB_NAME
    },
    userNameNormalizerFn: (userName: string) => {
        let normalizedName = userName.replaceAll("-", ".");
        normalizedName = process.env.USER_NAME_SUFFIX_TO_REPLACE ? normalizedName.replace(process.env.USER_NAME_SUFFIX_TO_REPLACE as string, "") : normalizedName;
        normalizedName = process.env.USER_NAME_PREFIX_TO_REPLACE ? normalizedName.replace(process.env.USER_NAME_PREFIX_TO_REPLACE as string, "") : normalizedName;
        return normalizedName;
    }
};