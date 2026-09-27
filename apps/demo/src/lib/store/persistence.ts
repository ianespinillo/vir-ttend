/**
 * Demo store — persistence.
 *
 * Persists the canonical demo state to localStorage under
 * DEMO_STORAGE_KEY ('virttend-demo-state:v1'). The storage backend is
 * injectable (MinimalStorage) so tests run against an in-memory mock with no
 * DOM/jsdom dependency.
 *
 * Schema guard: only states whose `version` equals STORAGE_SCHEMA_VERSION are
 * accepted on load; anything else (missing, corrupt, older schema) resolves to
 * `null` so the caller re-seeds deterministically.
 */

import type { DemoState } from './types';
import { DEMO_STORAGE_KEY, STORAGE_SCHEMA_VERSION } from './types';

/** The minimal storage surface the demo needs (localStorage-shaped). */
export interface MinimalStorage {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
	removeItem(key: string): void;
}

/** Storage with a try/catch guard for environments without a window. */
export function getDefaultStorage(): MinimalStorage | null {
	if (
		typeof window !== 'undefined' &&
		typeof window.localStorage !== 'undefined'
	) {
		return window.localStorage;
	}
	return null;
}

/** Read + validate the persisted demo state; null when absent/invalid. */
export function loadState(
	storage: MinimalStorage | null,
	key: string = DEMO_STORAGE_KEY,
): DemoState | null {
	if (!storage) {
		return null;
	}
	try {
		const raw = storage.getItem(key);
		if (!raw) {
			return null;
		}
		const parsed: unknown = JSON.parse(raw);
		if (!isValidDemoState(parsed)) {
			return null;
		}
		return reviveState(parsed);
	} catch {
		return null;
	}
}

/** Persist the state (no-op when no storage is available). */
export function saveState(
	state: DemoState,
	storage: MinimalStorage | null,
	key: string = DEMO_STORAGE_KEY,
): void {
	if (!storage) {
		return;
	}
	try {
		storage.setItem(key, JSON.stringify(state));
	} catch {
		// Storage full / unavailable — the demo keeps working in memory.
	}
}

/** Remove the persisted state (used by reset). */
export function clearPersistedState(
	storage: MinimalStorage | null,
	key: string = DEMO_STORAGE_KEY,
): void {
	if (!storage) {
		return;
	}
	try {
		storage.removeItem(key);
	} catch {
		// Ignore — reset still proceeds in memory.
	}
}

/** Structural + version guard for parsed states. */
export function isValidDemoState(value: unknown): value is DemoState {
	if (typeof value !== 'object' || value === null) {
		return false;
	}
	const candidate = value as Partial<DemoState>;
	return (
		candidate.version === STORAGE_SCHEMA_VERSION &&
		Array.isArray(candidate.tenants) &&
		Array.isArray(candidate.users) &&
		Array.isArray(candidate.academicYears) &&
		Array.isArray(candidate.courses) &&
		Array.isArray(candidate.subjects) &&
		Array.isArray(candidate.schedules) &&
		Array.isArray(candidate.students) &&
		Array.isArray(candidate.attendance) &&
		Array.isArray(candidate.alerts) &&
		Array.isArray(candidate.announcements) &&
		typeof candidate.announcementReads === 'object' &&
		candidate.announcementReads !== null &&
		typeof candidate.session === 'object' &&
		candidate.session !== null
	);
}

/**
 * Restore Date instances lost to JSON serialization. Only the known Date
 * paths are revived — strings that must stay strings (announcement
 * createdAt/publishAt, scheduled slot times) are left untouched.
 */
export function reviveState(parsed: DemoState): DemoState {
	const toDate = (value: unknown): Date | null =>
		typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)
			? new Date(value)
			: null;

	const state: DemoState = {
		...parsed,
		tenants: parsed.tenants.map((tenant) => ({
			...tenant,
			createdAt: toDate(tenant.createdAt) ?? new Date(tenant.createdAt),
		})),
		academicYears: parsed.academicYears.map((year) => ({
			...year,
			startDate: toDate(year.startDate) ?? new Date(year.startDate),
			endDate: toDate(year.endDate) ?? new Date(year.endDate),
		})),
		alerts: parsed.alerts.map((alert) => ({
			...alert,
			createdAt: toDate(alert.createdAt) ?? new Date(alert.createdAt),
			seenAt:
				alert.seenAt === null
					? null
					: (toDate(alert.seenAt) ?? new Date(alert.seenAt)),
		})),
		attendance: parsed.attendance.map((record) => ({
			...record,
			justification: record.justification
				? {
						...record.justification,
						createdAt:
							toDate(record.justification.createdAt) ??
							new Date(record.justification.createdAt),
					}
				: undefined,
		})),
	};
	return state;
}
