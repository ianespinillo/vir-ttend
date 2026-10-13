import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../config/app-config';
import {
	REFRESH_TOKEN_KEY,
	TENANT_KEY,
	TOKEN_KEY,
	clearStoredSession,
	notifySessionExpired,
	saveTokens,
} from './session-storage';

const REQUEST_TIMEOUT_MS = 10000;
// Server-side revocation on logout is best effort: keep it short so it never lingers.
const LOGOUT_REVOKE_TIMEOUT_MS = 5000;

export const api = axios.create({
	baseURL: API_URL,
	headers: {
		'Content-Type': 'application/json',
	},
	timeout: REQUEST_TIMEOUT_MS,
});

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
	try {
		const token = await SecureStore.getItemAsync(TOKEN_KEY);
		if (token && config.headers) {
			config.headers.Authorization = `Bearer ${token}`;
		}

		const tenantId = await SecureStore.getItemAsync(TENANT_KEY);
		if (tenantId && config.headers) {
			config.headers['x-tenant-id'] = tenantId;
		}
	} catch (error) {
		console.warn('Error reading tokens from SecureStore', error);
	}
	return config;
});

type RetriableRequestConfig = InternalAxiosRequestConfig & {
	_retried?: boolean;
};

// A 401 on these endpoints is a credentials/session problem, not an expired access token.
const NO_REFRESH_PATHS = [
	'/auth/login',
	'/auth/select-tenant',
	'/auth/refresh',
	'/auth/logout',
];

const shouldAttemptRefresh = (error: AxiosError): boolean => {
	const config = error.config as RetriableRequestConfig | undefined;
	if (error.response?.status !== 401 || !config || config._retried) {
		return false;
	}
	return !NO_REFRESH_PATHS.some((path) => config.url?.includes(path));
};

const expireSession = async (): Promise<void> => {
	try {
		await clearStoredSession();
	} catch (error) {
		console.warn('Error clearing SecureStore', error);
	}
	notifySessionExpired();
};

/**
 * Exchanges the stored refresh token for a new access token. Uses a bare axios
 * call so it bypasses the interceptors of `api` (no recursion, no stale bearer).
 *
 * Only an explicit 401 (or a missing refresh token) ends the session. Network
 * errors and 5xx responses just reject, so a flaky/offline connection never
 * signs the user out.
 */
const requestNewAccessToken = async (): Promise<string> => {
	const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
	if (!refreshToken) {
		await expireSession();
		throw new Error('No refresh token available');
	}

	try {
		const res = await axios.post(
			`${API_URL}/auth/refresh`,
			{ refreshToken },
			{ timeout: REQUEST_TIMEOUT_MS },
		);
		const payload = res.data?.data ?? res.data;
		const newAccessToken: string | undefined = payload?.accessToken;
		if (!newAccessToken) {
			throw new Error('Refresh response did not include an access token');
		}
		await saveTokens(newAccessToken, payload.refreshToken);
		return newAccessToken;
	} catch (error) {
		if (axios.isAxiosError(error) && error.response?.status === 401) {
			await expireSession();
		}
		throw error;
	}
};

const isUnauthorized = (error: unknown): boolean =>
	axios.isAxiosError(error) && error.response?.status === 401;

const postLogout = (accessToken: string, refreshToken: string) =>
	axios.post(
		`${API_URL}/auth/logout`,
		{ refreshToken },
		{
			headers: { Authorization: `Bearer ${accessToken}` },
			timeout: LOGOUT_REVOKE_TIMEOUT_MS,
		},
	);

/**
 * Gets an access token just to authorize the logout call, without touching
 * stored credentials (the local session is already gone at this point).
 */
const requestAccessTokenForLogout = async (
	refreshToken: string,
): Promise<string> => {
	const res = await axios.post(
		`${API_URL}/auth/refresh`,
		{ refreshToken },
		{ timeout: LOGOUT_REVOKE_TIMEOUT_MS },
	);
	const accessToken: string | undefined = (res.data?.data ?? res.data)
		?.accessToken;
	if (!accessToken) {
		throw new Error('Refresh response did not include an access token');
	}
	return accessToken;
};

/**
 * Revokes the refresh token server side, best effort. Uses bare axios calls
 * with credentials captured by the caller, so it works after local storage was
 * cleared and bypasses the interceptors of `api`: a 401 here can never trigger
 * the refresh/retry chain or `notifySessionExpired`. Never rejects.
 *
 * `/auth/logout` needs a valid access token plus the refresh token. When the
 * access token is missing or expired (401), it is renewed once from the refresh
 * token and the logout is retried once.
 */
export const revokeSessionOnServer = async (credentials: {
	accessToken: string | null;
	refreshToken: string | null;
}): Promise<void> => {
	const { accessToken, refreshToken } = credentials;
	if (!refreshToken) return;
	try {
		if (accessToken) {
			try {
				await postLogout(accessToken, refreshToken);
				return;
			} catch (error) {
				if (!isUnauthorized(error)) throw error;
			}
		}
		await postLogout(
			await requestAccessTokenForLogout(refreshToken),
			refreshToken,
		);
	} catch (error) {
		console.warn('Could not revoke the session on the server', error);
	}
};

// Single-flight: concurrent 401s share one in-flight refresh.
let refreshInFlight: Promise<string> | null = null;

export const refreshAccessToken = (): Promise<string> => {
	if (!refreshInFlight) {
		refreshInFlight = requestNewAccessToken().finally(() => {
			refreshInFlight = null;
		});
	}
	return refreshInFlight;
};

api.interceptors.response.use(
	(response) => response,
	async (error: AxiosError) => {
		if (!shouldAttemptRefresh(error)) {
			return Promise.reject(error);
		}

		const original = error.config as RetriableRequestConfig;
		original._retried = true;

		// The request may have been sent with a token that a concurrent refresh
		// already replaced: retry with the current one instead of refreshing again.
		const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
		const sentAuthorization = original.headers?.Authorization;
		if (storedToken && sentAuthorization !== `Bearer ${storedToken}`) {
			return api(original);
		}

		const newAccessToken = await refreshAccessToken();
		original.headers.Authorization = `Bearer ${newAccessToken}`;
		return api(original);
	},
);
