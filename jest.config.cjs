/** @type {import('jest').Config} */
module.exports = {
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
