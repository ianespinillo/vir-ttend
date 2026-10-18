import { describe, expect, it } from 'vitest';
import {
	type TourStorage,
	hasSeenTour,
	markTourSeen,
	tourStorageKey,
} from './tour-storage';

function memoryStorage(): TourStorage & { data: Map<string, string> } {
	const data = new Map<string, string>();
	return {
		data,
		getItem: (key) => data.get(key) ?? null,
		setItem: (key, value) => {
			data.set(key, value);
		},
	};
}

describe('tour storage', () => {
	it('remembers a tour per key', () => {
		const storage = memoryStorage();
		expect(hasSeenTour(storage, 'u-1:admin')).toBe(false);

		markTourSeen(storage, 'u-1:admin', new Date('2026-10-14T12:00:00Z'));

		expect(hasSeenTour(storage, 'u-1:admin')).toBe(true);
		expect(hasSeenTour(storage, 'u-1:preceptor')).toBe(false);
		expect(storage.data.get(tourStorageKey('u-1:admin'))).toBe(
			'2026-10-14T12:00:00.000Z',
		);
	});

	it('treats missing or broken storage as unseen without throwing', () => {
		const broken: TourStorage = {
			getItem: () => {
				throw new Error('blocked');
			},
			setItem: () => {
				throw new Error('quota');
			},
		};
		expect(hasSeenTour(null, 'k')).toBe(false);
		expect(hasSeenTour(broken, 'k')).toBe(false);
		expect(() => markTourSeen(broken, 'k')).not.toThrow();
		expect(() => markTourSeen(null, 'k')).not.toThrow();
	});
});
