import type { QueryClient } from '@tanstack/react-query';
import { type PreloadRole, runPreload } from './preload';

export type PreloadStatus = 'idle' | 'running' | 'done' | 'error';

export interface PreloadState {
	status: PreloadStatus;
	/** Epoch ms of the last fully successful preload (persisted per session). */
	lastSyncedAt: number | null;
}

export type PreloadTrigger = 'mount' | 'foreground' | 'reconnect' | 'manual';

/** Minimum time between preloads per trigger. `manual` always runs. */
export const PRELOAD_MIN_INTERVAL_MS: Record<PreloadTrigger, number> = {
	mount: 5 * 60 * 1000,
	foreground: 5 * 60 * 1000,
	reconnect: 60 * 1000,
	manual: 0,
};

export const IDLE_PRELOAD_STATE: PreloadState = {
	status: 'idle',
	lastSyncedAt: null,
};

export interface PreloadServiceDeps {
	queryClient: QueryClient;
	role: PreloadRole;
	isOnline: () => boolean;
	loadLastSyncedAt: () => Promise<number | null>;
	saveLastSyncedAt: (timestamp: number) => Promise<void>;
	now?: () => Date;
}

export interface PreloadService {
	getState: () => PreloadState;
	subscribe: (listener: () => void) => () => void;
	/** Loads the persisted `lastSyncedAt`. Call once before the first `run`. */
	init: () => Promise<void>;
	/** Starts a preload unless offline, already running, or throttled. */
	run: (trigger: PreloadTrigger) => Promise<void>;
	dispose: () => void;
}

/**
 * Single-flight, throttled preload of the offline cache for one session.
 * Plain TypeScript (no React) so it can be unit tested; the provider adapts it.
 * `run` never rejects.
 */
export const createPreloadService = (
	deps: PreloadServiceDeps,
): PreloadService => {
	const now = deps.now ?? (() => new Date());
	const listeners = new Set<() => void>();
	let state: PreloadState = IDLE_PRELOAD_STATE;
	let running: Promise<void> | null = null;
	let lastAttemptAt = 0;
	let disposed = false;

	const setState = (patch: Partial<PreloadState>): void => {
		if (disposed) return;
		state = { ...state, ...patch };
		for (const listener of [...listeners]) listener();
	};

	const execute = async (): Promise<void> => {
		const startedAt = now();
		lastAttemptAt = startedAt.getTime();
		setState({ status: 'running' });
		try {
			const result = await runPreload({
				queryClient: deps.queryClient,
				role: deps.role,
				now: startedAt,
				isCancelled: () => disposed,
			});
			if (result.cancelled || disposed) return;
			if (result.failed > 0) {
				setState({ status: 'error' });
				return;
			}
			const syncedAt = now().getTime();
			setState({ status: 'done', lastSyncedAt: syncedAt });
			await deps.saveLastSyncedAt(syncedAt).catch(() => undefined);
		} catch (error) {
			console.warn('Offline preload failed', error);
			setState({ status: 'error' });
		}
	};

	return {
		getState: () => state,
		subscribe: (listener) => {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
		init: async () => {
			const saved = await deps.loadLastSyncedAt().catch(() => null);
			if (saved !== null) setState({ lastSyncedAt: saved });
		},
		run: async (trigger) => {
			if (disposed || running || !deps.isOnline()) return;
			const reference = Math.max(lastAttemptAt, state.lastSyncedAt ?? 0);
			if (now().getTime() - reference < PRELOAD_MIN_INTERVAL_MS[trigger]) {
				return;
			}
			running = execute().finally(() => {
				running = null;
			});
			await running;
		},
		dispose: () => {
			disposed = true;
			listeners.clear();
		},
	};
};
