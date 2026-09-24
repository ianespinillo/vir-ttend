import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	type MinimalStorage,
	clearPersistedState,
	getDefaultStorage,
	isValidDemoState,
	loadState,
	saveState,
} from './persistence.js';
import { createSeedState } from './seed-data.js';
import { DEMO_STORAGE_KEY, STORAGE_SCHEMA_VERSION } from './types.js';

function createMockStorage(seed?: Record<string, string>): MinimalStorage {
	const store = new Map<string, string>(Object.entries(seed ?? {}));
	return {
		getItem: (key: string) => store.get(key) ?? null,
		setItem: (key: string, value: string) => void store.set(key, value),
		removeItem: (key: string) => void store.delete(key),
	};
}

const DEFAULT_KEY = DEMO_STORAGE_KEY;

beforeEach(() => {
	vi.stubGlobal('window', undefined);
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('persistence round trip', () => {
	it('saves and loads a state back (Dates restored)', () => {
		const storage = createMockStorage();
		const state = createSeedState();
		saveState(state, storage);
		expect(storage.getItem(DEFAULT_KEY)).not.toBeNull();

		const loaded = loadState(storage);
		expect(loaded).not.toBeNull();
		expect(loaded).toEqual(state);
		// Dates survive the JSON round trip as real Date instances.
		expect(loaded?.tenants[0]?.createdAt).toBeInstanceOf(Date);
		expect(loaded?.alerts[0]?.createdAt).toBeInstanceOf(Date);
		expect(loaded?.academicYears[0]?.startDate).toBeInstanceOf(Date);
	});

	it('loads null when nothing was persisted', () => {
		const storage = createMockStorage();
		expect(loadState(storage)).toBeNull();
	});

	it('rejects invalid or stale schema versions', () => {
		const storage = createMockStorage();
		storage.setItem(
			DEFAULT_KEY,
			JSON.stringify({
				...createSeedState(),
				version: STORAGE_SCHEMA_VERSION + 1,
			}),
		);
		expect(loadState(storage)).toBeNull();

		const corrupt = storage;
		corrupt.setItem(DEFAULT_KEY, '{not json');
		expect(loadState(corrupt)).toBeNull();
	});

	it('only accepts structurally valid states', () => {
		expect(isValidDemoState(null)).toBe(false);
		expect(isValidDemoState({ version: 1 })).toBe(false);
		expect(isValidDemoState(createSeedState())).toBe(true);
	});

	it('clearPersistedState removes the key', () => {
		const storage = createMockStorage();
		saveState(createSeedState(), storage);
		clearPersistedState(storage);
		expect(storage.getItem(DEFAULT_KEY)).toBeNull();
	});
});

describe('storage absence (SSR / node)', () => {
	it('no-ops when no storage is available', () => {
		expect(getDefaultStorage()).toBeNull();
		expect(loadState(null)).toBeNull();
		const state = createSeedState();
		expect(() => saveState(state, null)).not.toThrow();
		expect(() => clearPersistedState(null)).not.toThrow();
	});

	it('does not crash on storage exceptions', () => {
		const exploding: MinimalStorage = {
			getItem: () => {
				throw new Error('boom');
			},
			setItem: () => {
				throw new Error('boom');
			},
			removeItem: () => {
				throw new Error('boom');
			},
		};
		expect(loadState(exploding)).toBeNull();
		expect(() => saveState(createSeedState(), exploding)).not.toThrow();
		expect(() => clearPersistedState(exploding)).not.toThrow();
	});
});
