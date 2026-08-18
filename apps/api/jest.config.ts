import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	verbose: true,
	moduleFileExtensions: ['js', 'json', 'ts'],
	rootDir: '.',
	testMatch: ['<rootDir>/test/**/*.spec.ts'],
	transform: {
		'^.+\\.(t|j)s$': 'ts-jest',
	},
	collectCoverageFrom: ['src/**/*.(t|j)s'],
	coverageDirectory: './coverage',
	coveragePathIgnorePatterns: [
		'main.ts',
		'.dto.ts',
		'.module.ts',
		'.mock.ts',
		'common-imports',
		'db-testing.utils.ts',
		'roles',
		'decorators',
	],
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
	},
	setupFiles: ['<rootDir>/jest.setup.ts'],
};

export default config;
