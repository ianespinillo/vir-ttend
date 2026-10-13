import { onlineManager } from '@tanstack/react-query';
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { api } from '../../services/api';
import {
	type ServerReachability,
	serverReachability,
} from './server-reachability';

// While the server is unreachable nothing else may be calling it (no queued
// saves, no screen refetching), so a light ping notices when it comes back.
const PROBE_INTERVAL_MS = 15000;
const PROBE_TIMEOUT_MS = 5000;

/** Whether the API server answers (see `server-reachability.ts`). */
export const useServerReachability = (): ServerReachability =>
	useSyncExternalStore(
		serverReachability.subscribe,
		serverReachability.get,
		serverReachability.get,
	);

/**
 * Keeps probing `GET /health` while the server is unreachable, and calls
 * `onRecovered` when it answers again. The probe goes through `api`, so its
 * response updates the shared state like any other request. Mount it once
 * while signed in.
 */
export const useServerReachabilityMonitor = (onRecovered: () => void): void => {
	const status = useServerReachability();
	const previousStatus = useRef<ServerReachability>(status);
	const onRecoveredRef = useRef(onRecovered);
	onRecoveredRef.current = onRecovered;

	useEffect(() => {
		if (previousStatus.current === 'unreachable' && status === 'reachable') {
			onRecoveredRef.current();
		}
		previousStatus.current = status;
	}, [status]);

	useEffect(() => {
		if (status !== 'unreachable') return;
		const timer = setInterval(() => {
			if (!onlineManager.isOnline()) return;
			api.get('/health', { timeout: PROBE_TIMEOUT_MS }).catch(() => undefined);
		}, PROBE_INTERVAL_MS);
		return () => clearInterval(timer);
	}, [status]);
};
