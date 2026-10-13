import NetInfo from '@react-native-community/netinfo';
import {
	QueryClient,
	focusManager,
	onlineManager,
} from '@tanstack/react-query';
import { AppState } from 'react-native';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * How long cached data stays usable offline. `gcTime` must be at least
 * `maxAge`, otherwise queries are garbage collected before they can persist.
 */
export const CACHE_MAX_AGE_MS = 7 * DAY_MS;

/** Bump to discard every persisted cache after a breaking payload change. */
export const CACHE_BUSTER = 'v1';

export const createAppQueryClient = (): QueryClient =>
	new QueryClient({
		defaultOptions: {
			queries: {
				retry: 1,
				staleTime: 1000 * 60 * 5, // 5 minutes
				gcTime: CACHE_MAX_AGE_MS,
			},
		},
	});

let managersConfigured = false;

/**
 * Wires React Query to the device: `onlineManager` follows NetInfo (queries
 * pause offline and resume on reconnect) and `focusManager` follows AppState.
 * Idempotent.
 */
export const configureQueryManagers = (): void => {
	if (managersConfigured) return;
	managersConfigured = true;

	onlineManager.setEventListener((setOnline) =>
		// `isConnected` is null until NetInfo knows: treat unknown as online.
		NetInfo.addEventListener((state) => setOnline(state.isConnected !== false)),
	);

	focusManager.setEventListener((handleFocus) => {
		const subscription = AppState.addEventListener('change', (status) =>
			handleFocus(status === 'active'),
		);
		return () => subscription.remove();
	});
};
