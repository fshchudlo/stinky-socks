import { Config } from '@jest/types';

const config: Config.InitialOptions = {
    clearMocks: true,
    testMatch: [
        './**/*.test[s].ts',
    ],
    rootDir: './',
    coverageDirectory: './coverage',
    preset: 'ts-jest',
    testEnvironment: 'node',
    detectOpenHandles: true,
    testTimeout: 50000
};

export default config;