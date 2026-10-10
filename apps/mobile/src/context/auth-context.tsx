import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
	type MobileAppConfig,
	type TenancyMode,
	getAppConfig,
	saveCustomAppName,
	saveTenancyMode,
} from '../config/app-config';
import { api } from '../services/api';

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
	updateAppName: (name: string) => Promise<void>;
	updateTenancyMode: (mode: TenancyMode) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'virttend_access_token';
const TENANT_KEY = 'virttend_tenant_id';
const USER_KEY = 'virttend_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [user, setUser] = useState<MobileUser | null>(null);
	const [token, setToken] = useState<string | null>(null);
	const [tenantId, setTenantId] = useState<string | null>(null);
	const [pendingUserId, setPendingUserId] = useState<string | null>(null);
	const [availableTenants, setAvailableTenants] = useState<TenantOption[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [config, setConfig] = useState<MobileAppConfig>({
		appName: 'Vir-ttend',
		tenancyMode: 'multi',
		defaultTenantId: null,
		defaultTenantName: null,
		apiUrl: 'http://localhost:3001',
	});

	useEffect(() => {
		const loadInitialState = async () => {
			try {
				const appCfg = await getAppConfig();
				setConfig(appCfg);

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
						await SecureStore.deleteItemAsync(TOKEN_KEY);
						await SecureStore.deleteItemAsync(TENANT_KEY);
						await SecureStore.deleteItemAsync(USER_KEY);
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

			// Single-tenant mode check:
			if (config.tenancyMode === 'single') {
				// If a default tenant is configured in environment, find it or default to the first valid tenant
				const chosenTenant = config.defaultTenantId
					? validTenants.find((t) => t.tenantId === config.defaultTenantId) ||
						validTenants[0]
					: validTenants[0];

				await selectTenantDirect(userId, chosenTenant.tenantId);
				return { requiresTenantSelection: false };
			}

			// Multi-tenant mode:
			if (validTenants.length === 1) {
				await selectTenantDirect(userId, validTenants[0].tenantId);
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
			await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
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

	const logout = async () => {
		try {
			await SecureStore.deleteItemAsync(TOKEN_KEY);
			await SecureStore.deleteItemAsync(TENANT_KEY);
			await SecureStore.deleteItemAsync(USER_KEY);
		} catch (error) {
			console.warn('Error clearing SecureStore', error);
		} finally {
			setToken(null);
			setTenantId(null);
			setUser(null);
			setPendingUserId(null);
			setAvailableTenants([]);
		}
	};

	const updateAppName = async (name: string) => {
		await saveCustomAppName(name);
		const refreshed = await getAppConfig();
		setConfig(refreshed);
	};

	const updateTenancyMode = async (mode: TenancyMode) => {
		await saveTenancyMode(mode);
		const refreshed = await getAppConfig();
		setConfig(refreshed);
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
				updateAppName,
				updateTenancyMode,
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
