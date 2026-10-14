import { onlineManager, useQueryClient } from '@tanstack/react-query';
import React, {
	createContext,
	useEffect,
	useMemo,
	useSyncExternalStore,
} from 'react';
import { AppState } from 'react-native';
import { useAuth } from '../../context/auth-context';
import { buildSessionScope } from './cache-keys';
import {
	type OutboxService,
	type OutboxState,
	createOutboxService,
} from './outbox-service';
import type {
	DailyOutboxItem,
	EnqueueDailyInput,
	EnqueueSubjectInput,
	EnqueueWorkshopInput,
	OutboxItem,
	SubjectOutboxItem,
	WorkshopOutboxItem,
} from './outbox-types';
import { useServerReachabilityMonitor } from './use-server-reachability';

export interface OutboxContextValue extends OutboxState {
	/** Pending or syncing items. */
	pendingCount: number;
	/** Transient failures: still queued, retried automatically. */
	retryingCount: number;
	/** Permanent failures awaiting the user (retry or discard). */
	errorCount: number;
	enqueueDaily: (input: EnqueueDailyInput) => Promise<void>;
	enqueueSubject: (input: EnqueueSubjectInput) => Promise<void>;
	enqueueWorkshop: (input: EnqueueWorkshopInput) => Promise<void>;
	flush: (options?: { force?: boolean }) => Promise<void>;
	removeItem: (id: string) => Promise<void>;
	retryItem: (id: string) => Promise<void>;
	getItem: (id: string) => OutboxItem | undefined;
	getItemForCourse: (
		courseId: string,
		date: string,
	) => DailyOutboxItem | undefined;
	getItemForSubject: (
		subjectId: string,
		date: string,
	) => SubjectOutboxItem | undefined;
	getItemForCommission: (
		commissionId: string,
		date: string,
	) => WorkshopOutboxItem | undefined;
}

const DEFAULT_STATE: OutboxState = {
	items: [],
	isSyncing: false,
	initialized: false,
};

export const OutboxContext = createContext<OutboxContextValue | null>(null);

const NO_SESSION_MESSAGE =
	'No hay una sesión activa para guardar la asistencia.';

const noopSubscribe = () => () => undefined;
const getDefaultState = () => DEFAULT_STATE;

export function OutboxProvider({ children }: { children: React.ReactNode }) {
	const { user, tenantId } = useAuth();
	const queryClient = useQueryClient();

	const activeTenantId = tenantId ?? user?.tenantId ?? null;
	const scope =
		user && activeTenantId ? buildSessionScope(user.id, activeTenantId) : null;

	const service: OutboxService | null = useMemo(() => {
		if (!scope) return null;
		return createOutboxService({
			scope,
			queryClient,
			isOnline: () => onlineManager.isOnline(),
		});
	}, [queryClient, scope]);

	// The server answering again is a reason to send what is queued right away
	// instead of waiting for the next backoff timer.
	useServerReachabilityMonitor(() => {
		void service?.flush({ force: true });
	});

	useEffect(() => {
		if (!service) return;

		void service.init().then(() => service.flush({ force: true }));

		const appStateSubscription = AppState.addEventListener('change', (status) => {
			if (status === 'active') void service.flush({ force: true });
		});
		const unsubscribeOnline = onlineManager.subscribe((online) => {
			if (online) void service.flush({ force: true });
		});

		return () => {
			appStateSubscription.remove();
			unsubscribeOnline();
			service.dispose();
		};
	}, [service]);

	const state = useSyncExternalStore(
		service ? service.subscribe : noopSubscribe,
		service ? service.getState : getDefaultState,
		getDefaultState,
	);

	const value = useMemo<OutboxContextValue>(
		() => ({
			...state,
			pendingCount: service?.getPendingCount() ?? 0,
			retryingCount: service?.getRetryingCount() ?? 0,
			errorCount: service?.getErrorCount() ?? 0,
			// Without a session nothing can be saved: reject instead of faking success.
			enqueueDaily: async (input) => {
				if (!service) throw new Error(NO_SESSION_MESSAGE);
				await service.enqueueDaily(input);
			},
			enqueueSubject: async (input) => {
				if (!service) throw new Error(NO_SESSION_MESSAGE);
				await service.enqueueSubject(input);
			},
			enqueueWorkshop: async (input) => {
				if (!service) throw new Error(NO_SESSION_MESSAGE);
				await service.enqueueWorkshop(input);
			},
			flush: async (options) => {
				await service?.flush(options);
			},
			removeItem: async (id) => {
				await service?.removeItem(id);
			},
			retryItem: async (id) => {
				await service?.retryItem(id);
			},
			getItem: (id) => service?.getItem(id),
			getItemForCourse: (courseId, date) =>
				service?.getItemForCourse(courseId, date),
			getItemForSubject: (subjectId, date) =>
				service?.getItemForSubject(subjectId, date),
			getItemForCommission: (commissionId, date) =>
				service?.getItemForCommission(commissionId, date),
		}),
		[state, service],
	);

	return (
		<OutboxContext.Provider value={value}>{children}</OutboxContext.Provider>
	);
}
