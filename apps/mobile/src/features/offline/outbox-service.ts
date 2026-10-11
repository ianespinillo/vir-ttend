import AsyncStorage from '@react-native-async-storage/async-storage';
import type { QueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { api } from '../../services/api';
import { queryKeys } from '../attendance/query-keys';
import type {
	AttendanceRecordItem,
	CourseSnapshot,
	DailyAttendance,
	SubjectAttendance,
} from '../attendance/types';
import { outboxStorageKey } from './cache-keys';
import type {
	DailyOutboxItem,
	EnqueueDailyInput,
	EnqueueSubjectInput,
	OutboxItem,
	OutboxRecord,
	SubjectOutboxItem,
} from './outbox-types';

export const buildDailyOutboxId = (courseId: string, date: string): string =>
	`daily:${courseId}:${date}`;

export const buildSubjectOutboxId = (subjectId: string, date: string): string =>
	`subject:${subjectId}:${date}`;

/**
 * Distinguishes permanent 4xx validation/permission errors from transient network/5xx/401 errors.
 * - Permanent: 400 "Invalid class day", 403 Forbidden, 404, 422. Preserved for the user to fix.
 * - Transient: offline, timeouts, 5xx, 401 (automatic refresh will retry).
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
			status !== 408
		) {
			return {
				isPermanent: true,
				message,
				statusCode: status,
			};
		}

		// 401 (session expired / auth), 408 (timeout), 5xx, or network disconnect
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

export const applyOptimisticDailyAttendance = (
	queryClient: QueryClient,
	courseId: string,
	date: string,
	records: OutboxRecord[],
): void => {
	queryClient.setQueryData<DailyAttendance>(
		queryKeys.dailyAttendance(courseId, date),
		(prev) => {
			const existingMap = new Map(
				(prev?.records ?? []).map((r) => [r.studentId, r]),
			);
			const updatedRecords: AttendanceRecordItem[] = records.map((r) => {
				const existing = existingMap.get(r.studentId);
				return {
					id: existing?.id,
					studentId: r.studentId,
					studentName: existing?.studentName,
					status: r.status,
				};
			});
			return {
				courseId,
				date,
				records: updatedRecords,
			};
		},
	);

	queryClient.setQueryData<CourseSnapshot[]>(
		queryKeys.preceptorDashboard(date),
		(prev) => {
			if (!prev) return prev;
			const present = records.filter((r) => r.status === 'present').length;
			const absent = records.filter((r) => r.status === 'absent').length;
			const late = records.filter((r) => r.status === 'late').length;
			return prev.map((course) => {
				if (course.courseId !== courseId) return course;
				const total = course.totalStudents ?? records.length;
				const notRecorded = Math.max(0, total - (present + absent + late));
				const attendancePercent =
					total > 0 ? Math.round((present / total) * 100) : 0;
				return {
					...course,
					present,
					absent,
					late,
					notRecorded,
					attendancePercent,
				};
			});
		},
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
		(prev) => {
			const existingMap = new Map(
				(prev?.records ?? []).map((r) => [r.studentId, r]),
			);
			const updatedRecords: AttendanceRecordItem[] = records.map((r) => {
				const existing = existingMap.get(r.studentId);
				return {
					id: existing?.id,
					studentId: r.studentId,
					studentName: existing?.studentName,
					status: r.status,
				};
			});
			return {
				subjectId,
				subjectName: subjectName ?? prev?.subjectName ?? '',
				courseId,
				date,
				records: updatedRecords,
			};
		},
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
	now?: () => number;
}

export interface OutboxService {
	getState: () => OutboxState;
	subscribe: (listener: () => void) => () => void;
	init: () => Promise<void>;
	enqueueDaily: (input: EnqueueDailyInput) => Promise<void>;
	enqueueSubject: (input: EnqueueSubjectInput) => Promise<void>;
	flush: (options?: { force?: boolean }) => Promise<void>;
	removeItem: (id: string) => Promise<void>;
	getItem: (id: string) => OutboxItem | undefined;
	getItemForCourse: (
		courseId: string,
		date: string,
	) => DailyOutboxItem | undefined;
	getItemForSubject: (
		subjectId: string,
		date: string,
	) => SubjectOutboxItem | undefined;
	getPendingCount: () => number;
	getErrorCount: () => number;
	dispose: () => void;
}

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
			try {
				await AsyncStorage.setItem(outboxStorageKey(scope), JSON.stringify(items));
			} catch (error) {
				console.warn('Failed to persist attendance outbox to storage', error);
			}
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

	const listeners = new Set<() => void>();
	let state: OutboxState = {
		items: [],
		isSyncing: false,
		initialized: false,
	};
	let runningFlush: Promise<void> | null = null;
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

	const persistStateItems = async (items: OutboxItem[]): Promise<void> => {
		state = { ...state, items };
		notify();
		await saveItems(deps.scope, items);
	};

	const init = async (): Promise<void> => {
		if (state.initialized || disposed) return;
		const items = await loadItems(deps.scope);
		if (disposed) return;
		state = {
			...state,
			items,
			initialized: true,
		};
		notify();
		scheduleNextRetryIfNeeded();
	};

	const flush = async (options?: { force?: boolean }): Promise<void> => {
		if (disposed) return;
		if (!state.initialized) {
			await init();
		}

		if (runningFlush) {
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
							// Invalidate queries so fresh server records load
							deps.queryClient.invalidateQueries({
								queryKey: queryKeys.dailyAttendance(
									currentItem.courseId,
									currentItem.date,
								),
							});
							deps.queryClient.invalidateQueries({
								queryKey: queryKeys.preceptorDashboard(currentItem.date),
							});
						} else {
							await sendSubject(currentItem);
							deps.queryClient.invalidateQueries({
								queryKey: queryKeys.subjectAttendance(
									currentItem.subjectId,
									currentItem.date,
								),
							});
						}

						// Remove synced item from outbox
						const remaining = state.items.filter((i) => i.id !== id);
						await persistStateItems(remaining);
					} catch (error) {
						const classified = classifyError(error);
						const attemptTime = now();

						const updated = state.items.map((i) => {
							if (i.id !== id) return i;
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

		// Optimistic React Query cache update
		applyOptimisticDailyAttendance(
			deps.queryClient,
			input.courseId,
			input.date,
			input.records,
		);

		await persistStateItems(nextItems);

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

		// Optimistic React Query cache update
		applyOptimisticSubjectAttendance(
			deps.queryClient,
			input.subjectId,
			input.courseId,
			input.subjectName,
			input.date,
			input.records,
		);

		await persistStateItems(nextItems);

		// Trigger background flush if online
		if (deps.isOnline()) {
			flush().catch(() => undefined);
		}
	};

	const removeItem = async (id: string): Promise<void> => {
		if (!state.initialized) await init();
		const remaining = state.items.filter((i) => i.id !== id);
		await persistStateItems(remaining);
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

	const getPendingCount = (): number =>
		state.items.filter((i) => i.status === 'pending' || i.status === 'syncing')
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
		flush,
		removeItem,
		getItem,
		getItemForCourse,
		getItemForSubject,
		getPendingCount,
		getErrorCount,
		dispose,
	};
};
