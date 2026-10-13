import * as SecureStore from 'expo-secure-store';

export const TOKEN_KEY = 'virttend_access_token';
export const REFRESH_TOKEN_KEY = 'virttend_refresh_token';
export const TENANT_KEY = 'virttend_tenant_id';
export const USER_KEY = 'virttend_user';

/**
 * Persists the session tokens. The refresh token is only overwritten when the
 * API returns one, so a response without it keeps the stored token.
 */
export const saveTokens = async (
	accessToken: string,
	refreshToken?: string,
): Promise<void> => {
	await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
	if (refreshToken) {
		await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
	}
};

/** Removes every piece of persisted session state. */
export const clearStoredSession = async (): Promise<void> => {
	await SecureStore.deleteItemAsync(TOKEN_KEY);
	await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
	await SecureStore.deleteItemAsync(TENANT_KEY);
	await SecureStore.deleteItemAsync(USER_KEY);
};

type SessionExpiredListener = () => void;

const sessionExpiredListeners = new Set<SessionExpiredListener>();

/**
 * Subscribes to "the session can no longer be renewed" notifications.
 * Returns an unsubscribe function.
 */
export const onSessionExpired = (
	listener: SessionExpiredListener,
): (() => void) => {
	sessionExpiredListeners.add(listener);
	return () => {
		sessionExpiredListeners.delete(listener);
	};
};

export const notifySessionExpired = (): void => {
	for (const listener of [...sessionExpiredListeners]) {
		listener();
	}
};
