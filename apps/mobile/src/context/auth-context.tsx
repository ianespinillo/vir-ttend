import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';

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
	login: (
		email: string,
		password: string,
	) => Promise<{ requiresTenantSelection: boolean }>;
	selectTenant: (tenantId: string) => Promise<void>;
	logout: () => Promise<void>;
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

	useEffect(() => {
		const loadStorageData = async () => {
			try {
				const savedToken = await SecureStore.getItemAsync(TOKEN_KEY);
				const savedTenant = await SecureStore.getItemAsync(TENANT_KEY);
				const savedUser = await SecureStore.getItemAsync(USER_KEY);

				if (savedToken && savedUser) {
					setToken(savedToken);
					setTenantId(savedTenant);
					setUser(JSON.parse(savedUser));
				}
			} catch (error) {
				console.warn('Failed to restore auth state', error);
			} finally {
				setIsLoading(false);
			}
		};

		loadStorageData();
	}, []);

	const login = async (email: string, password: string) => {
		setIsLoading(true);
		try {
			const res = await api.post('/auth/login', { email, password });
			const { data } = res.data;

			const userId = data.userId;
			const tenants = data.tenants || [];

			// If single tenant or only 1 tenant available, select it automatically
			if (tenants.length === 1) {
				const chosenTenant = tenants[0];
				await selectTenantDirect(userId, chosenTenant.tenantId);
				return { requiresTenantSelection: false };
			}

			// Multiple tenants require selection
			setPendingUserId(userId);
			setAvailableTenants(tenants);
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
		const loggedUser = authData.user;
		const accessToken = authData.accessToken;

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

	return (
		<AuthContext.Provider
			value={{
				user,
				token,
				tenantId,
				pendingUserId,
				availableTenants,
				isLoading,
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
