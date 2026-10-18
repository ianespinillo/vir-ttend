/**
 * "Tour seen" flags, one per user and role, kept in the browser. Reads and
 * writes never throw: without storage (private mode, SSR) the tour simply
 * behaves as unseen.
 */

export interface TourStorage {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
}

export const TOUR_STORAGE_PREFIX = 'vt.tour.v1.';

export function tourStorageKey(key: string): string {
	return `${TOUR_STORAGE_PREFIX}${key}`;
}

export function defaultTourStorage(): TourStorage | null {
	try {
		return typeof window === 'undefined' ? null : window.localStorage;
	} catch {
		return null;
	}
}

export function hasSeenTour(storage: TourStorage | null, key: string): boolean {
	if (!storage) return false;
	try {
		return storage.getItem(tourStorageKey(key)) !== null;
	} catch {
		return false;
	}
}

export function markTourSeen(
	storage: TourStorage | null,
	key: string,
	now: Date = new Date(),
): void {
	if (!storage) return;
	try {
		storage.setItem(tourStorageKey(key), now.toISOString());
	} catch {
		// Quota exceeded or storage blocked: the tour shows again next time.
	}
}
