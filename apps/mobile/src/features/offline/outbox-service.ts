import AsyncStorage from '@react-native-async-storage/async-storage';
import type { QueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { api } from '../../services/api';
import { mergeOptimisticRecords } from '../attendance/optimistic-records';
import { queryKeys } from '../attendance/query-keys';
import type {
	DailyAttendance,
	SubjectAttendance,
	WorkshopAttendance,
} from '../attendance/types';
import { outboxStorageKey } from './cache-keys';
import type {
	DailyOutboxItem,
	EnqueueDailyInput,
	EnqueueSubjectInput,
	EnqueueWorkshopInput,
	OutboxItem,
	OutboxRecord,
	SubjectOutboxItem,
	WorkshopOutboxItem,
} from './outbox-types';

export const buildDailyOutboxId = (courseId: string, date: string): string =>
	`daily:${courseId}:${date}`;

export const buildWorkshopOutboxId = (
	commissionId: string,
	date: string,
): string => `workshop:${commissionId}:${date}`;

export const buildSubjectOutboxId = (subjectId: string, date: string): string =>
	`subject:${subjectId}:${date}`;

/**
 * Distinguishes permanent 4xx validation/permission errors from transient network/5xx/401 errors.
 * - Permanent: 400 "Invalid class day", 403 Forbidden, 404, 422. Preserved for the user to fix.
 * - Transient: offline, timeouts, 5xx, 401 (automatic refresh will retry), and
 *   409: two saves of the same attendance raced on its unique constraint; the
 *   retry finds the stored record and updates it.
 */
export const classifyError = (
	error: unknown,
): { isPermanent: boolean; message: string; statusCode?: number } => {
	if (axios.isAxiosError(error)) {
		const status = error.response?.status;
		const data = error.response?.data as
			| { message?: string | string[]; error?: string }
			| undefined;

		let message = '';
		if (Array.isArray(data?.message)) {
			message = data.message.join(', ');
		} else if (typeof data?.message === 'string') {
			message = data.message;
		} else if (typeof data?.error === 'string') {
			message = data.error;
		} else if (error.message) {
			message = error.message;
		} else {
			message = 'Error en la solicitud';
		}

		// Permanent 4xx errors (non-401, non-408): client/domain constraints, e.g. "Invalid class day", 403 Forbidden
		if (
			status &&
			status >= 400 &&
			status < 500 &&
			status !== 401 &&
			status !== 408 &&
			status !== 409
		) {
			return {
				isPermanent: true,
				message,
				statusCode: status,
			};
		}

		// 401 (session expired / auth), 408 (timeout), 409 (save race), 5xx, or network disconnect
		const isNetworkOrTimeout =
			!error.response || error.code === 'ECONNABORTED' || status === 408;
		return {
			isPermanent: false,
			message: isNetworkOrTimeout
				? 'Error de conexión a internet'
				: status === 401
					? 'Sesión no autorizada o expirada'
					: message || 'Error del servidor',
			statusCode: status,
		};
	}

	if (error instanceof Error) {
		return {
			isPermanent: false,
			message: error.message,
		};
	}

	return {
		isPermanent: false,
		message: 'Error inesperado',
	};
};

/** Exponential backoff: 1s, 2s, 4s, 8s, 16s, 32s, max 60s. */
export const getBackoffDelay = (retryCount: number): number =>
	Math.min(1000 * 2 ** Math.max(0, Math.min(retryCount - 1, 6)), 60000);

/**
 * Mirrors a queued daily save into the day's cached records. The dashboard
 * cache is intentionally left alone: its snapshots are year-to-date aggregates,
 * so writing today-only numbers there would be reverted by the next refetch.
 */
export const applyOptimisticDailyAttendance = (
	queryClient: QueryClient,
	courseId: string,
	date: string,
	records: OutboxRecord[],
): void => {
	queryClient.setQueryData<DailyAttendance>(
		queryKeys.dailyAttendance(courseId, date),
		(prev) => ({
			courseId,
			date,
			records: mergeOptimisticRecords(prev?.records ?? [], records),
		}),
	);
};

export const applyOptimisticSubjectAttendance = (
	queryClient: QueryClient,
	subjectId: string,
	courseId: string,
	subjectName: string | undefined,
	date: string,
	records: OutboxRecord[],
): void => {
	queryClient.setQueryData<SubjectAttendance>(
		queryKeys.subjectAttendance(subjectId, date),
		(prev) => ({
			subjectId,
			subjectName: subjectName ?? prev?.subjectName ?? '',
			courseId,
			date,
			records: mergeOptimisticRecords(prev?.records ?? [], records),
		}),
	);
};

export const applyOptimisticWorkshopAttendance = (
	queryClient: QueryClient,
	commissionId: string,
	date: string,
	records: OutboxRecord[],
): void => {
	queryClient.setQueryData<WorkshopAttendance>(
		queryKeys.workshopAttendance(commissionId, date),
		(prev) => ({
			commissionId,
			date,
			records: mergeOptimisticRecords(prev?.records ?? [], records),
		}),
	);
};

export interface OutboxState {
	items: OutboxItem[];
	isSyncing: boolean;
	initialized: boolean;
}

export interface OutboxServiceDeps {
	scope: string;
	queryClient: QueryClient;
	isOnline: () => boolean;
	loadItems?: (scope: string) => Promise<OutboxItem[]>;
	saveItems?: (scope: string, items: OutboxItem[]) => Promise<void>;
	sendDaily?: (item: DailyOutboxItem) => Promise<void>;
	sendSubject?: (item: SubjectOutboxItem) => Promise<void>;
	sendWorkshop?: (item: WorkshopOutboxItem) => Promise<void>;
	now?: () => number;
}

export interface OutboxService {
	getState: () => OutboxState;
	subscribe: (listener: () => void) => () => void;
	init: () => Promise<void>;
	enqueueDaily: (input: EnqueueDailyInput) => Promise<void>;
	enqueueSubject: (input: EnqueueSubjectInput) => Promise<void>;
	enqueueWorkshop: (input: EnqueueWorkshopInput) => Promise<void>;
	flush: (options?: { force?: boolean }) => Promise<void>;
	removeItem: (id: string) => Promise<void>;
	/** Re-queues a failed item as pending and forces a flush. */
	retryItem: (id: string) => Promise<void>;
	getItem: (id: string) => OutboxItem | undefined;
	getItemForCourse: (
		courseId: string,
		date: string,
	) => DailyOutboxItem | undefined;
	getItemForSubject: (
		subjectId: string,
		date: string,
	) => SubjectOutboxItem | undefined;
	getItemForCommission: (
		commissionId: string,
		date: string,
	) => WorkshopOutboxItem | undefined;
	getPendingCount: () => number;
	getRetryingCount: () => number;
	getErrorCount: () => number;
	dispose: () => void;
}

/**
 * Enqueue replaces `records` and bumps `updatedAt`, so an item whose records
 * reference and timestamp are unchanged is the same revision that was sent.
 */
const isSameRevision = (a: OutboxItem, b: OutboxItem): boolean =>
	a.updatedAt === b.updatedAt && a.records === b.records;

export const createOutboxService = (deps: OutboxServiceDeps): OutboxService => {
	const now = deps.now ?? (() => Date.now());
	const loadItems =
		deps.loadItems ??
		(async (scope: string): Promise<OutboxItem[]> => {
			try {
				const raw = await AsyncStorage.getItem(outboxStorageKey(scope));
				if (!raw) return [];
				const parsed = JSON.parse(raw);
				return Array.isArray(parsed) ? parsed : [];
			} catch (error) {
				console.warn('Failed to load attendance outbox from storage', error);
				return [];
			}
		});

	const saveItems =
		deps.saveItems ??
		(async (scope: string, items: OutboxItem[]): Promise<void> => {
			// Rejects on failure: enqueue must not report "saved locally" otherwise.
			await AsyncStorage.setItem(outboxStorageKey(scope), JSON.stringify(items));
		});

	const sendDaily =
		deps.sendDaily ??
		(async (item: DailyOutboxItem): Promise<void> => {
			await api.post('/attendance/daily', {
				courseId: item.courseId,
				date: item.date,
				records: item.records,
			});
		});

	const sendSubject =
		deps.sendSubject ??
		(async (item: SubjectOutboxItem): Promise<void> => {
			await api.post('/attendance/subject', {
				subjectId: item.subjectId,
				courseId: item.courseId,
				date: item.date,
				records: item.records,
			});
		});

	// Same upsert as daily attendance: the API replaces the commission's records
	// of the day, so resending an item after a lost response is safe.
	const sendWorkshop =
		deps.sendWorkshop ??
		(async (item: WorkshopOutboxItem): Promise<void> => {
			await api.post('/attendance/workshop', {
				commissionId: item.commissionId,
				date: item.date,
				records: item.records,
			});
		});

	const listeners = new Set<() => void>();
	let state: OutboxState = {
		items: [],
		isSyncing: false,
		initialized: false,
	};
	let runningFlush: Promise<void> | null = null;
	// Set when flush() is requested while one is running, so edits enqueued
	// mid-flush are sent by a follow-up pass instead of waiting for a trigger.
	let rerunRequested = false;
	let retryTimer: ReturnType<typeof setTimeout> | null = null;
	let disposed = false;

	const notify = (): void => {
		if (disposed) return;
		for (const listener of [...listeners]) {
			listener();
		}
	};

	const clearRetryTimer = (): void => {
		if (retryTimer) {
			clearTimeout(retryTimer);
			retryTimer = null;
		}
	};

	const scheduleNextRetryIfNeeded = (): void => {
		clearRetryTimer();
		if (disposed || !deps.isOnline()) return;

		const transientItems = state.items.filter(
			(i) => i.status === 'failed' && !i.error?.isPermanent && i.lastAttemptAt,
		);
		if (transientItems.length === 0) return;

		const currentTime = now();
		let minRemaining = Number.POSITIVE_INFINITY;
		for (const item of transientItems) {
			const delay = getBackoffDelay(item.retryCount);
			const remaining = (item.lastAttemptAt ?? 0) + delay - currentTime;
			if (remaining < minRemaining) {
				minRemaining = remaining;
			}
		}

		const waitMs = Math.max(500, minRemaining);
		if (waitMs < Number.POSITIVE_INFINITY) {
			retryTimer = setTimeout(() => {
				retryTimer = null;
				flush().catch(() => undefined);
			}, waitMs);
		}
	};

	/** Best effort: flush bookkeeping keeps going when storage is failing. */
	const persistStateItems = async (items: OutboxItem[]): Promise<void> => {
		state = { ...state, items };
		notify();
		try {
			await saveItems(deps.scope, items);
		} catch (error) {
			console.warn('Failed to persist attendance outbox to storage', error);
		}
	};

	/**
	 * Strict: applies `items` in memory, then persists. When storage rejects the
	 * in-memory change is rolled back (see `rollback`) and the error is rethrown,
	 * so callers can tell the user the change was NOT saved.
	 */
	const persistStrict = async (
		items: OutboxItem[],
		rollback: (current: OutboxItem[]) => OutboxItem[],
	): Promise<void> => {
		state = { ...state, items };
		notify();
		try {
			await saveItems(deps.scope, items);
		} catch (error) {
			console.warn('Failed to persist attendance outbox to storage', error);
			state = { ...state, items: rollback(state.items) };
			notify();
			throw new Error('No se pudo guardar en el dispositivo', { cause: error });
		}
	};

	/** Puts `previous` back in place of whatever currently holds its id. */
	const restoreItem = (
		current: OutboxItem[],
		id: string,
		previous: OutboxItem | undefined,
	): OutboxItem[] => {
		if (!previous) return current.filter((i) => i.id !== id);
		return current.some((i) => i.id === id)
			? current.map((i) => (i.id === id ? previous : i))
			: [...current, previous];
	};

	/** Refetches what an item touched so the cache returns to server truth. */
	const invalidateItemQueries = (item: OutboxItem): void => {
		if (item.type === 'daily') {
			deps.queryClient.invalidateQueries({
				queryKey: queryKeys.dailyAttendance(item.courseId, item.date),
			});
			// Year-to-date snapshots change once the day is stored.
			deps.queryClient.invalidateQueries({
				queryKey: queryKeys.preceptorDashboard(item.date),
			});
		} else if (item.type === 'workshop') {
			deps.queryClient.invalidateQueries({
				queryKey: queryKeys.workshopAttendance(item.commissionId, item.date),
			});
		} else {
			deps.queryClient.invalidateQueries({
				queryKey: queryKeys.subjectAttendance(item.subjectId, item.date),
			});
		}
	};

	let initPromise: Promise<void> | null = null;

	const init = (): Promise<void> => {
		if (state.initialized || disposed) return Promise.resolve();
		// Concurrent callers share one load: a second, later load must never
		// overwrite items enqueued after the first one finished.
		if (!initPromise) {
			initPromise = (async () => {
				const loaded = await loadItems(deps.scope);
				if (disposed || state.initialized) return;
				// Anything already in memory is newer than what storage returned.
				const inMemoryIds = new Set(state.items.map((i) => i.id));
				state = {
					...state,
					items: [...loaded.filter((i) => !inMemoryIds.has(i.id)), ...state.items],
					initialized: true,
				};
				notify();
				scheduleNextRetryIfNeeded();
			})().finally(() => {
				initPromise = null;
			});
		}
		return initPromise;
	};

	const flush = async (options?: { force?: boolean }): Promise<void> => {
		if (disposed) return;
		if (!state.initialized) {
			await init();
		}

		if (runningFlush) {
			rerunRequested = true;
			return runningFlush;
		}

		if (!deps.isOnline()) {
			return;
		}

		const execute = async (): Promise<void> => {
			clearRetryTimer();
			const currentTime = now();
			const force = options?.force ?? false;

			// Filter items eligible for flush
			const candidateIds = state.items
				.filter((item) => {
					// Permanent errors are never auto-retried; user must resolve.
					if (item.status === 'failed' && item.error?.isPermanent) {
						return false;
					}
					// If failed and backoff has not elapsed (unless force requested)
					if (!force && item.retryCount > 0 && item.lastAttemptAt) {
						const delay = getBackoffDelay(item.retryCount);
						if (currentTime - item.lastAttemptAt < delay) {
							return false;
						}
					}
					return true;
				})
				.map((i) => i.id);

			if (candidateIds.length === 0) {
				scheduleNextRetryIfNeeded();
				return;
			}

			state = { ...state, isSyncing: true };
			notify();

			try {
				for (const id of candidateIds) {
					if (disposed || !deps.isOnline()) break;

					const currentItem = state.items.find((i) => i.id === id);
					if (!currentItem) continue;

					// Mark item as syncing
					const syncingItems = state.items.map((i) =>
						i.id === id ? { ...i, status: 'syncing' as const } : i,
					);
					await persistStateItems(syncingItems);

					try {
						if (currentItem.type === 'daily') {
							await sendDaily(currentItem);
						} else if (currentItem.type === 'workshop') {
							await sendWorkshop(currentItem);
						} else {
							await sendSubject(currentItem);
						}
						// Invalidate queries so fresh server records load
						invalidateItemQueries(currentItem);

						// Remove the synced item only if it was not re-enqueued while
						// the request was in flight; a newer revision stays pending.
						const remaining = state.items.filter(
							(i) => !(i.id === id && isSameRevision(i, currentItem)),
						);
						await persistStateItems(remaining);
					} catch (error) {
						const classified = classifyError(error);
						const attemptTime = now();

						const updated = state.items.map((i) => {
							if (i.id !== id || !isSameRevision(i, currentItem)) return i;
							if (classified.isPermanent) {
								return {
									...i,
									status: 'failed' as const,
									error: {
										message: classified.message,
										statusCode: classified.statusCode,
										isPermanent: true,
										timestamp: attemptTime,
									},
								};
							}
							return {
								...i,
								status: 'failed' as const,
								retryCount: (i.retryCount ?? 0) + 1,
								lastAttemptAt: attemptTime,
								error: {
									message: classified.message,
									statusCode: classified.statusCode,
									isPermanent: false,
									timestamp: attemptTime,
								},
							};
						});

						await persistStateItems(updated);

						// If network dropped or 401 unrecoverable, break early
						if (!deps.isOnline() || classified.statusCode === 401) {
							break;
						}
					}
				}
			} finally {
				state = { ...state, isSyncing: false };
				notify();
				scheduleNextRetryIfNeeded();
			}
		};

		runningFlush = execute().finally(() => {
			runningFlush = null;
			if (rerunRequested && !disposed) {
				rerunRequested = false;
				void flush();
			}
		});

		return runningFlush;
	};

	const enqueueDaily = async (input: EnqueueDailyInput): Promise<void> => {
		if (!state.initialized) await init();

		const id = buildDailyOutboxId(input.courseId, input.date);
		const currentTime = now();
		const existingIndex = state.items.findIndex((i) => i.id === id);

		let nextItems: OutboxItem[];
		if (existingIndex >= 0) {
			const existing = state.items[existingIndex] as DailyOutboxItem;
			const updated: DailyOutboxItem = {
				...existing,
				records: input.records,
				courseName: input.courseName ?? existing.courseName,
				updatedAt: currentTime,
				status: 'pending',
				error: undefined,
				retryCount: 0,
				lastAttemptAt: undefined,
			};
			nextItems = [
				...state.items.slice(0, existingIndex),
				updated,
				...state.items.slice(existingIndex + 1),
			];
		} else {
			const newItem: DailyOutboxItem = {
				id,
				type: 'daily',
				courseId: input.courseId,
				courseName: input.courseName,
				date: input.date,
				records: input.records,
				createdAt: currentTime,
				updatedAt: currentTime,
				status: 'pending',
				retryCount: 0,
			};
			nextItems = [...state.items, newItem];
		}

		const previousItem =
			existingIndex >= 0 ? state.items[existingIndex] : undefined;
		await persistStrict(nextItems, (current) =>
			restoreItem(current, id, previousItem),
		);

		// Optimistic React Query cache update (only once the save is durable)
		applyOptimisticDailyAttendance(
			deps.queryClient,
			input.courseId,
			input.date,
			input.records,
		);

		// Trigger background flush if online
		if (deps.isOnline()) {
			flush().catch(() => undefined);
		}
	};

	const enqueueSubject = async (input: EnqueueSubjectInput): Promise<void> => {
		if (!state.initialized) await init();

		const id = buildSubjectOutboxId(input.subjectId, input.date);
		const currentTime = now();
		const existingIndex = state.items.findIndex((i) => i.id === id);

		let nextItems: OutboxItem[];
		if (existingIndex >= 0) {
			const existing = state.items[existingIndex] as SubjectOutboxItem;
			const updated: SubjectOutboxItem = {
				...existing,
				records: input.records,
				subjectName: input.subjectName ?? existing.subjectName,
				courseName: input.courseName ?? existing.courseName,
				updatedAt: currentTime,
				status: 'pending',
				error: undefined,
				retryCount: 0,
				lastAttemptAt: undefined,
			};
			nextItems = [
				...state.items.slice(0, existingIndex),
				updated,
				...state.items.slice(existingIndex + 1),
			];
		} else {
			const newItem: SubjectOutboxItem = {
				id,
				type: 'subject',
				subjectId: input.subjectId,
				courseId: input.courseId,
				subjectName: input.subjectName,
				courseName: input.courseName,
				date: input.date,
				records: input.records,
				createdAt: currentTime,
				updatedAt: currentTime,
				status: 'pending',
				retryCount: 0,
			};
			nextItems = [...state.items, newItem];
		}

		const previousItem =
			existingIndex >= 0 ? state.items[existingIndex] : undefined;
		await persistStrict(nextItems, (current) =>
			restoreItem(current, id, previousItem),
		);

		// Optimistic React Query cache update (only once the save is durable)
		applyOptimisticSubjectAttendance(
			deps.queryClient,
			input.subjectId,
			input.courseId,
			input.subjectName,
			input.date,
			input.records,
		);

		// Trigger background flush if online
		if (deps.isOnline()) {
			flush().catch(() => undefined);
		}
	};

	const enqueueWorkshop = async (input: EnqueueWorkshopInput): Promise<void> => {
		if (!state.initialized) await init();

		const id = buildWorkshopOutboxId(input.commissionId, input.date);
		const currentTime = now();
		const existingIndex = state.items.findIndex((i) => i.id === id);

		let nextItems: OutboxItem[];
		if (existingIndex >= 0) {
			const existing = state.items[existingIndex] as WorkshopOutboxItem;
			const updated: WorkshopOutboxItem = {
				...existing,
				records: input.records,
				commissionLabel: input.commissionLabel ?? existing.commissionLabel,
				updatedAt: currentTime,
				status: 'pending',
				error: undefined,
				retryCount: 0,
				lastAttemptAt: undefined,
			};
			nextItems = [
				...state.items.slice(0, existingIndex),
				updated,
				...state.items.slice(existingIndex + 1),
			];
		} else {
			const newItem: WorkshopOutboxItem = {
				id,
				type: 'workshop',
				commissionId: input.commissionId,
				commissionLabel: input.commissionLabel,
				date: input.date,
				records: input.records,
				createdAt: currentTime,
				updatedAt: currentTime,
				status: 'pending',
				retryCount: 0,
			};
			nextItems = [...state.items, newItem];
		}

		const previousItem =
			existingIndex >= 0 ? state.items[existingIndex] : undefined;
		await persistStrict(nextItems, (current) =>
			restoreItem(current, id, previousItem),
		);

		// Optimistic React Query cache update (only once the save is durable)
		applyOptimisticWorkshopAttendance(
			deps.queryClient,
			input.commissionId,
			input.date,
			input.records,
		);

		// Trigger background flush if online
		if (deps.isOnline()) {
			flush().catch(() => undefined);
		}
	};

	const removeItem = async (id: string): Promise<void> => {
		if (!state.initialized) await init();
		const removed = state.items.find((i) => i.id === id);
		if (!removed) return;
		await persistStrict(
			state.items.filter((i) => i.id !== id),
			(current) => restoreItem(current, id, removed),
		);
		// A discarded save leaves optimistic data in the cache: reload the server's.
		invalidateItemQueries(removed);
	};

	const retryItem = async (id: string): Promise<void> => {
		if (!state.initialized) await init();
		const failed = state.items.find((i) => i.id === id);
		if (!failed) return;
		const requeued: OutboxItem = {
			...failed,
			status: 'pending',
			error: undefined,
			retryCount: 0,
			lastAttemptAt: undefined,
		};
		await persistStrict(
			state.items.map((i) => (i.id === id ? requeued : i)),
			(current) => restoreItem(current, id, failed),
		);
		if (deps.isOnline()) {
			await flush({ force: true });
		}
	};

	const getItem = (id: string): OutboxItem | undefined =>
		state.items.find((i) => i.id === id);

	const getItemForCourse = (
		courseId: string,
		date: string,
	): DailyOutboxItem | undefined => {
		const id = buildDailyOutboxId(courseId, date);
		const item = state.items.find((i) => i.id === id);
		return item?.type === 'daily' ? item : undefined;
	};

	const getItemForSubject = (
		subjectId: string,
		date: string,
	): SubjectOutboxItem | undefined => {
		const id = buildSubjectOutboxId(subjectId, date);
		const item = state.items.find((i) => i.id === id);
		return item?.type === 'subject' ? item : undefined;
	};

	const getItemForCommission = (
		commissionId: string,
		date: string,
	): WorkshopOutboxItem | undefined => {
		const id = buildWorkshopOutboxId(commissionId, date);
		const item = state.items.find((i) => i.id === id);
		return item?.type === 'workshop' ? item : undefined;
	};

	const getPendingCount = (): number =>
		state.items.filter((i) => i.status === 'pending' || i.status === 'syncing')
			.length;

	/** Failed transiently: still queued and retried automatically. */
	const getRetryingCount = (): number =>
		state.items.filter((i) => i.status === 'failed' && !i.error?.isPermanent)
			.length;

	const getErrorCount = (): number =>
		state.items.filter((i) => i.status === 'failed' && i.error?.isPermanent)
			.length;

	const dispose = (): void => {
		disposed = true;
		clearRetryTimer();
		listeners.clear();
	};

	return {
		getState: () => state,
		subscribe: (listener) => {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
		init,
		enqueueDaily,
		enqueueSubject,
		enqueueWorkshop,
		flush,
		removeItem,
		retryItem,
		getItem,
		getItemForCourse,
		getItemForSubject,
		getItemForCommission,
		getPendingCount,
		getRetryingCount,
		getErrorCount,
		dispose,
	};
};
