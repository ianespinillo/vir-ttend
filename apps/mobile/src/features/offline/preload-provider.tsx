import AsyncStorage from '@react-native-async-storage/async-storage';
import { onlineManager, useQueryClient } from '@tanstack/react-query';
import React, {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useSyncExternalStore,
} from 'react';
import { AppState } from 'react-native';
import { useAuth } from '../../context/auth-context';
import { buildSessionScope, syncMetaKey } from './cache-keys';
import { preloadRoleOf } from './preload';
import {
	IDLE_PRELOAD_STATE,
	type PreloadService,
	type PreloadState,
	createPreloadService,
} from './preload-service';

interface PreloadContextValue extends PreloadState {
	/** Forces a refresh of the offline cache (no-op while offline). */
	preloadNow: () => Promise<void>;
}

const PreloadContext = createContext<PreloadContextValue>({
	...IDLE_PRELOAD_STATE,
	preloadNow: async () => undefined,
});

const noopSubscribe = () => () => undefined;
const getIdleState = () => IDLE_PRELOAD_STATE;

/**
 * Keeps the offline cache fresh while the user is signed in. Triggers: when it
 * mounts (right after login / select-tenant, or on app start with a session),
 * when the app returns to the foreground, and when connectivity comes back.
 * Must be rendered inside `AuthProvider` and `AppQueryProvider`.
 */
export function PreloadProvider({ children }: { children: React.ReactNode }) {
	const { user, tenantId } = useAuth();
	const queryClient = useQueryClient();

	const role = preloadRoleOf(user?.role);
	const activeTenantId = tenantId ?? user?.tenantId ?? null;
	const scope =
		user && activeTenantId ? buildSessionScope(user.id, activeTenantId) : null;

	const service: PreloadService | null = useMemo(() => {
		if (!role || !scope) return null;
		const metaKey = syncMetaKey(scope);
		return createPreloadService({
			queryClient,
			role,
			isOnline: () => onlineManager.isOnline(),
			loadLastSyncedAt: async () => {
				const raw = await AsyncStorage.getItem(metaKey);
				const parsed = raw === null ? Number.NaN : Number(raw);
				return Number.isFinite(parsed) ? parsed : null;
			},
			saveLastSyncedAt: (timestamp) =>
				AsyncStorage.setItem(metaKey, String(timestamp)),
		});
	}, [queryClient, role, scope]);

	useEffect(() => {
		if (!service) return;

		void service.init().then(() => service.run('mount'));

		const appStateSubscription = AppState.addEventListener('change', (status) => {
			if (status === 'active') void service.run('foreground');
		});
		const unsubscribeOnline = onlineManager.subscribe((online) => {
			if (online) void service.run('reconnect');
		});

		return () => {
			appStateSubscription.remove();
			unsubscribeOnline();
			service.dispose();
		};
	}, [service]);

	const state = useSyncExternalStore(
		service ? service.subscribe : noopSubscribe,
		service ? service.getState : getIdleState,
		getIdleState,
	);

	const value = useMemo<PreloadContextValue>(
		() => ({
			...state,
			preloadNow: async () => {
				await service?.run('manual');
			},
		}),
		[state, service],
	);

	return (
		<PreloadContext.Provider value={value}>{children}</PreloadContext.Provider>
	);
}

export const usePreload = (): PreloadContextValue => useContext(PreloadContext);
