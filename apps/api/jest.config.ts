import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	verbose: true,
	moduleFileExtensions: ['js', 'json', 'ts'],
	rootDir: '.',
	testMatch: ['<rootDir>/src/**/*.spec.ts', '<rootDir>/test/**/*.spec.ts'],
	setupFiles: ['<rootDir>/jest.setup.ts'],
	transform: {
		'^.+\\.(t|j)s$': 'ts-jest',
	},
	collectCoverageFrom: [
		'**/*.(t|j)s',
		'!**/*.dto.ts',
		'!**/*.module.ts',
		'!**/*.mock.ts',
		'!**/main.ts',
		'!**/common-imports/**',
		'!**/db-testing.utils.ts',
		'!**/roles/**',
		'!**/decorators/**',
	],
	coverageDirectory: '../coverage',
	coverageThreshold: {
		global: {
			branches: 90,
			functions: 90,
			lines: 90,
			statements: 90,
		},
	},
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/src/$1',
		'^@repo/common$': '<rootDir>/../../packages/common/src/index',
		'^@repo/common/(.*)$': '<rootDir>/../../packages/common/src/$1',
		'^(\\.{1,2}/.*)\\.js$': '$1',
	},
	testTimeout: 60000,
};

export default config;
