'use client';

import type { CurrentUser, TenantOption } from '@repo/common';
import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
} from 'react';
import type { ReactNode } from 'react';

interface AuthContextValue {
	user: CurrentUser | null;
	tenant: TenantOption | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	setUser: (user: CurrentUser | null) => void;
	clearUser: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<CurrentUser | null>(null);
	const [tenant, setTenant] = useState<TenantOption | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const handleSetUser = useCallback((next: CurrentUser | null) => {
		setUser(next);
		if (next === null) {
			setTenant(null);
		}
		setIsLoading(false);
	}, []);

	const clearUser = useCallback(() => {
		setUser(null);
		setTenant(null);
	}, []);

	const value = useMemo<AuthContextValue>(
		() => ({
			user,
			tenant,
			isAuthenticated: user !== null,
			isLoading,
			setUser: handleSetUser,
			clearUser,
		}),
		[user, tenant, isLoading, handleSetUser, clearUser],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth debe usarse dentro de <AuthProvider>');
	}
	return context;
}
