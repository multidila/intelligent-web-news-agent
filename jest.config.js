const baseConfig = require('./jest.preset.js');

module.exports = {
	...baseConfig,
	preset: 'jest-preset-angular',
	setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
	testEnvironment: 'jsdom',
	testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/'],
	coverageDirectory: '<rootDir>/coverage',
	collectCoverage: true,
	collectCoverageFrom: ['src/**/*.ts', '!src/**/*.spec.ts', '!src/**/*.mock.ts', '!src/**/index.ts'],
	coverageReporters: ['html', 'text', 'lcov'],
};
