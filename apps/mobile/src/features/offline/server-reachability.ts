import { onlineManager } from '@tanstack/react-query';
import axios from 'axios';

/**
 * Whether the API server answers, as seen by our own requests. It is separate
 * from device connectivity (NetInfo): a phone can be online while the server
 * is down, or while the USB `adb reverse` tunnel to it is not set up.
 *
 * - `unknown`: nothing observed yet (or the device went offline).
 * - `reachable`: the last request got an HTTP response.
 * - `unreachable`: a request failed without a response while the device is
 *   online (timeout, connection refused, DNS, gateway error).
 */
export type ServerReachability = 'unknown' | 'reachable' | 'unreachable';

export type RequestOutcome = 'answered' | 'no-answer' | 'ignored';

// A gateway/proxy that cannot reach the API answers on its behalf: the API
// itself is not reachable even though an HTTP response arrived.
const GATEWAY_STATUSES: readonly number[] = [502, 503, 504];

/** What a failed request says about the server. Pure. */
export const classifyRequestFailure = (error: unknown): RequestOutcome => {
	if (!axios.isAxiosError(error) || axios.isCancel(error)) return 'ignored';
	if (!error.response) return 'no-answer';
	return GATEWAY_STATUSES.includes(error.response.status)
		? 'no-answer'
		: 'answered';
};

/**
 * Next state after a request outcome. A failure without an answer only counts
 * while the device is online: offline, the cause is the missing network and
 * the offline indicator already says so. Pure.
 */
export const nextReachability = (
	current: ServerReachability,
	outcome: RequestOutcome,
	deviceOnline: boolean,
): ServerReachability => {
	if (outcome === 'answered') return 'reachable';
	if (outcome === 'no-answer' && deviceOnline) return 'unreachable';
	return current;
};

export interface ReachabilityStore {
	get: () => ServerReachability;
	subscribe: (listener: () => void) => () => void;
	reportSuccess: () => void;
	/** Classifies a failed request and updates the state. */
	reportFailure: (error: unknown) => void;
	reset: () => void;
}

export const createReachabilityStore = (
	isDeviceOnline: () => boolean,
): ReachabilityStore => {
	let state: ServerReachability = 'unknown';
	const listeners = new Set<() => void>();

	const set = (next: ServerReachability): void => {
		if (next === state) return;
		state = next;
		for (const listener of [...listeners]) listener();
	};

	return {
		get: () => state,
		subscribe: (listener) => {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
		reportSuccess: () => set(nextReachability(state, 'answered', true)),
		reportFailure: (error) =>
			set(
				nextReachability(state, classifyRequestFailure(error), isDeviceOnline()),
			),
		reset: () => set('unknown'),
	};
};

/** Shared store, fed by the response interceptors in `services/api.ts`. */
export const serverReachability = createReachabilityStore(() =>
	onlineManager.isOnline(),
);

// Without a network the previous verdict is stale: start over once it returns.
onlineManager.subscribe((online) => {
	if (!online) serverReachability.reset();
});
