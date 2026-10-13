import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import {
	IsRestoringProvider,
	QueryClientProvider,
} from '@tanstack/react-query';
import {
	persistQueryClientRestore,
	persistQueryClientSubscribe,
} from '@tanstack/react-query-persist-client';
import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/auth-context';
import { buildSessionScope, queryCacheKey } from './cache-keys';
import { clearAllOfflineCaches } from './clear-offline-cache';
import {
	CACHE_BUSTER,
	CACHE_MAX_AGE_MS,
	configureQueryManagers,
	createAppQueryClient,
} from './query-client';

configureQueryManagers();

/**
 * Storage adapter whose writes stop once the session scope is disposed.
 * The persister throttles writes, so a trailing write could otherwise land
 * after logout cleared the storage and resurrect the previous user's data.
 */
const createGuardedStorage = (guard: { disposed: boolean }) => ({
	getItem: (key: string) => AsyncStorage.getItem(key),
	setItem: async (key: string, value: string) => {
		if (!guard.disposed) await AsyncStorage.setItem(key, value);
	},
	removeItem: (key: string) => AsyncStorage.removeItem(key),
});

// react-query's typings may resolve a different @types/react than the app, so
// borrow its own `children` type instead of `React.ReactNode`.
type QueryProviderChildren = React.ComponentProps<
	typeof QueryClientProvider
>['children'];

/**
 * Owns the `QueryClient` and persists it to AsyncStorage, one cache per
 * user + school. Must be rendered inside `AuthProvider`.
 *
 * - Signed in: restores that session's cache, then keeps it persisted.
 * - Signed out (logout, expired session, role rejected): drops the in-memory
 *   cache and every persisted cache, so nobody sees the previous user's data.
 * - Switching user/school: the in-memory cache is dropped before restoring.
 * - Only successful queries are persisted; errored/pending ones never are.
 */
export function AppQueryProvider({
	children,
}: { children: QueryProviderChildren }) {
	const [queryClient] = useState(createAppQueryClient);
	const { user, tenantId, isLoading } = useAuth();

	const activeTenantId = tenantId ?? user?.tenantId ?? null;
	const scope =
		user && activeTenantId ? buildSessionScope(user.id, activeTenantId) : null;

	const [restoredScope, setRestoredScope] = useState<string | null>(null);
	const activeScopeRef = useRef<string | null>(null);

	useEffect(() => {
		if (!scope) return;

		if (activeScopeRef.current && activeScopeRef.current !== scope) {
			queryClient.clear();
		}
		activeScopeRef.current = scope;

		const guard = { disposed: false };
		const options = {
			queryClient,
			persister: createAsyncStoragePersister({
				storage: createGuardedStorage(guard),
				key: queryCacheKey(scope),
			}),
			maxAge: CACHE_MAX_AGE_MS,
			buster: CACHE_BUSTER,
			dehydrateOptions: {
				shouldDehydrateQuery: (query: { state: { status: string } }) =>
					query.state.status === 'success',
				shouldDehydrateMutation: () => false,
			},
		};

		let unsubscribe: (() => void) | undefined;
		persistQueryClientRestore(options)
			.catch((error) => {
				console.warn('Could not restore the offline cache', error);
			})
			.finally(() => {
				if (guard.disposed) return;
				setRestoredScope(scope);
				unsubscribe = persistQueryClientSubscribe(options);
			});

		return () => {
			guard.disposed = true;
			unsubscribe?.();
		};
	}, [scope, queryClient]);

	// `isLoading` is also true while the stored session is being restored, so a
	// missing scope only means "signed out" once loading finished.
	useEffect(() => {
		if (scope || isLoading) return;
		activeScopeRef.current = null;
		queryClient.clear();
		setRestoredScope(null);
		void clearAllOfflineCaches();
	}, [scope, isLoading, queryClient]);

	return (
		<QueryClientProvider client={queryClient}>
			<IsRestoringProvider value={scope !== null && restoredScope !== scope}>
				{children}
			</IsRestoringProvider>
		</QueryClientProvider>
	);
}
