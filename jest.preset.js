const path = require('path');
const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig.base.json');

const workspaceRoot = path.resolve(__dirname);
const tsPathMapper = pathsToModuleNameMapper(compilerOptions.paths ?? {}, {
	prefix: `${workspaceRoot}${path.sep}`,
});

const nxPreset = require('@nx/jest/preset').default;

const config = {
	...nxPreset,
	testMatch: ['**/+(*.)+(spec|test).+(ts|js)?(x)'],
	transform: {
		'^.+\\.(ts|js|mjs|html)$': [
			'jest-preset-angular',
			{
				diagnostics: false,
				isolatedModules: true,
				stringifyContentPathRegex: '\\.(html|svg)$',
				tsconfig: '<rootDir>/tsconfig.spec.json',
			},
		],
		'^.+VERSION$': 'jest-raw-loader',
		'^.+\\.bpmn$': 'jest-raw-loader',
		'^.+\\.svg$': 'jest-raw-loader',
	},
	resolver: '@nx/jest/plugins/resolver',
	moduleFileExtensions: ['ts', 'js', 'html'],
	collectCoverage: false,
	coverageReporters: ['lcov', 'text'],
	coveragePathIgnorePatterns: [
		'<rootDir>/node_modules/',
		'<rootDir>/dist/',
		'<rootDir>.*.stories.ts',
		'<rootDir>/src/polyfills.ts',
		'<rootDir>/src/main.ts',
		'<rootDir>/src/test.ts',
		'<rootDir>.*.spec.ui.ts',
		'<rootDir>.*.*mock.ts',
	],
	collectCoverageFrom: ['src/**/*.js', 'src/**/*.ts'],
	snapshotSerializers: [
		'jest-preset-angular/build/serializers/no-ng-attributes.js',
		'jest-preset-angular/build/serializers/ng-snapshot.js',
		'jest-preset-angular/build/serializers/html-comment.js',
	],
	moduleNameMapper: {
		...tsPathMapper,
		'^raw-loader!(.*)$': './$1',
		'^!?!?raw-loader\\?\\{esModule:false\\}!(.*)$': './$1',
		'^url-loader!(.*)$': './$1',
		'^!?!?url-loader\\?\\{esModule:false\\}!(.*)$': './$1',
	},
	reporters: ['default', ['jest-junit', { outputDirectory: '<rootDir>/junit', outputName: 'jest.xml' }]],
	transformIgnorePatterns: ['/node_modules/(?!.*.mjs$)(?!lodash-es)(?!@angular)'],
	workerIdleMemoryLimit: '768MB',
	fakeTimers: {
		legacyFakeTimers: true,
	},
};

if (process.env.JEST_CACHE_DIR) {
	config.cacheDirectory = process.env.JEST_CACHE_DIR;
}

module.exports = config;
