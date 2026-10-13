import * as SecureStore from 'expo-secure-store';
import React, {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useState,
} from 'react';
import { STATIC_APP_INFO, clearLegacyConfigKeys } from '../config/app-config';
import {
	type MobileAppConfig,
	buildMobileConfig,
} from '../features/config/mobile-config';
import { decideTenantSelection } from '../features/config/tenant-selection';
import { useServerConfig } from '../features/config/use-server-config';
import { clearAllOfflineCaches } from '../features/offline/clear-offline-cache';
import { api, revokeSessionOnServer } from '../services/api';
import {
	REFRESH_TOKEN_KEY,
	TENANT_KEY,
	TOKEN_KEY,
	USER_KEY,
	clearStoredSession,
	onSessionExpired,
	saveTokens,
} from '../services/session-storage';

export const ALLOWED_MOBILE_ROLES = ['preceptor', 'teacher'];

export interface MobileUser {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	role: string;
	tenantId: string;
	mustChangePassword: boolean;
}

export interface TenantOption {
	tenantId: string;
	name?: string;
	role?: string;
}

interface AuthContextType {
	user: MobileUser | null;
	token: string | null;
	tenantId: string | null;
	pendingUserId: string | null;
	availableTenants: TenantOption[];
	isLoading: boolean;
	config: MobileAppConfig;
	login: (
		email: string,
		password: string,
	) => Promise<{ requiresTenantSelection: boolean }>;
	selectTenant: (tenantId: string) => Promise<void>;
	logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [user, setUser] = useState<MobileUser | null>(null);
	const [token, setToken] = useState<string | null>(null);
	const [tenantId, setTenantId] = useState<string | null>(null);
	const [pendingUserId, setPendingUserId] = useState<string | null>(null);
	const [availableTenants, setAvailableTenants] = useState<TenantOption[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const serverConfig = useServerConfig();
	const config = useMemo<MobileAppConfig>(
		() =>
			buildMobileConfig(STATIC_APP_INFO, serverConfig.config, serverConfig.status),
		[serverConfig.config, serverConfig.status],
	);

	useEffect(() => {
		const loadInitialState = async () => {
			try {
				await clearLegacyConfigKeys();

				const savedToken = await SecureStore.getItemAsync(TOKEN_KEY);
				const savedTenant = await SecureStore.getItemAsync(TENANT_KEY);
				const savedUser = await SecureStore.getItemAsync(USER_KEY);

				if (savedToken && savedUser) {
					const parsedUser: MobileUser = JSON.parse(savedUser);
					// Validate role on startup
					if (ALLOWED_MOBILE_ROLES.includes(parsedUser.role?.toLowerCase())) {
						setToken(savedToken);
						setTenantId(savedTenant);
						setUser(parsedUser);
					} else {
						// Invalid role in storage
						await clearStoredSession();
					}
				}
			} catch (error) {
				console.warn('Failed to restore auth state', error);
			} finally {
				setIsLoading(false);
			}
		};

		loadInitialState();
	}, []);

	// The API client clears storage and notifies us when the refresh token is
	// rejected; here we only need to reset the in-memory state.
	useEffect(() => {
		return onSessionExpired(() => {
			resetSessionState();
		});
	}, []);

	const login = async (email: string, password: string) => {
		setIsLoading(true);
		try {
			const res = await api.post('/auth/login', { email, password });
			const { data } = res.data;

			// Prohibit superadmins or global accounts without preceptor/teacher assignment
			if (data.isSuperAdmin) {
				throw new Error(
					'Acceso restringido: Esta aplicación móvil es de uso exclusivo para preceptores y docentes.',
				);
			}

			const userId = data.userId;
			const allTenants: TenantOption[] = data.tenants || [];

			// Filter only tenants where the user has an allowed role (preceptor or teacher)
			const validTenants = allTenants.filter(
				(t) => t.role && ALLOWED_MOBILE_ROLES.includes(t.role.toLowerCase()),
			);

			if (validTenants.length === 0) {
				throw new Error(
					'Acceso restringido: No tenés asignado un rol de preceptor o docente en ninguna institución.',
				);
			}

			// The server owns the tenancy mode. Read it fresh when this run has not
			// yet (login needs the server anyway); fall back to the cached copy.
			const serverTenancy =
				serverConfig.status === 'fresh'
					? serverConfig.config
					: ((await serverConfig.refresh()) ?? serverConfig.config);

			const selection = decideTenantSelection(
				serverTenancy,
				validTenants.map((t) => t.tenantId),
			);

			if (selection.kind === 'denied') {
				throw new Error(selection.message);
			}

			if (selection.kind === 'direct') {
				await selectTenantDirect(userId, selection.tenantId);
				return { requiresTenantSelection: false };
			}

			setPendingUserId(userId);
			setAvailableTenants(validTenants);
			return { requiresTenantSelection: true };
		} finally {
			setIsLoading(false);
		}
	};

	const selectTenantDirect = async (uId: string, tId: string) => {
		const res = await api.post('/auth/select-tenant', {
			userId: uId,
			tenantId: tId,
		});

		const authData = res.data?.data || res.data;
		const loggedUser: MobileUser = authData.user;
		const accessToken = authData.accessToken;

		// Verify allowed role explicitly
		if (!ALLOWED_MOBILE_ROLES.includes(loggedUser.role?.toLowerCase())) {
			await logout();
			throw new Error(
				'Acceso restringido: Tu usuario no posee permisos de preceptor o docente en esta institución.',
			);
		}

		if (accessToken) {
			await saveTokens(accessToken, authData.refreshToken);
			setToken(accessToken);
		}

		await SecureStore.setItemAsync(TENANT_KEY, tId);
		await SecureStore.setItemAsync(USER_KEY, JSON.stringify(loggedUser));

		setTenantId(tId);
		setUser(loggedUser);
		setPendingUserId(null);
		setAvailableTenants([]);
	};

	const selectTenant = async (tId: string) => {
		if (!pendingUserId && !user) {
			throw new Error('No user available to select tenant');
		}
		const uId = pendingUserId || user?.id;
		if (!uId) throw new Error('Missing user id');
		setIsLoading(true);
		try {
			await selectTenantDirect(uId, tId);
		} finally {
			setIsLoading(false);
		}
	};

	const resetSessionState = () => {
		setToken(null);
		setTenantId(null);
		setUser(null);
		setPendingUserId(null);
		setAvailableTenants([]);
	};

	const logout = async () => {
		// Capture the credentials first: local sign-out must be immediate and the
		// server-side revocation (fire-and-forget) needs them after storage is cleared.
		let credentials: { accessToken: string | null; refreshToken: string | null } =
			{ accessToken: null, refreshToken: null };
		try {
			credentials = {
				accessToken: await SecureStore.getItemAsync(TOKEN_KEY),
				refreshToken: await SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
			};
		} catch (error) {
			console.warn('Error reading tokens from SecureStore', error);
		}

		try {
			await clearStoredSession();
		} catch (error) {
			console.warn('Error clearing SecureStore', error);
		}
		// The previous user's offline data must be gone before the next sign-in.
		await clearAllOfflineCaches();
		resetSessionState();

		// A network failure must not delay or prevent the local sign-out.
		void revokeSessionOnServer(credentials);
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				token,
				tenantId,
				pendingUserId,
				availableTenants,
				isLoading,
				config,
				login,
				selectTenant,
				logout,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
};
