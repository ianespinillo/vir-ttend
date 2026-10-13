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
	OutboxItem,
	SubjectOutboxItem,
} from './outbox-types';

export interface OutboxContextValue extends OutboxState {
	pendingCount: number;
	errorCount: number;
	enqueueDaily: (input: EnqueueDailyInput) => Promise<void>;
	enqueueSubject: (input: EnqueueSubjectInput) => Promise<void>;
	flush: (options?: { force?: boolean }) => Promise<void>;
	removeItem: (id: string) => Promise<void>;
	getItem: (id: string) => OutboxItem | undefined;
	getItemForCourse: (
		courseId: string,
		date: string,
	) => DailyOutboxItem | undefined;
	getItemForSubject: (
		subjectId: string,
		date: string,
	) => SubjectOutboxItem | undefined;
}

const DEFAULT_STATE: OutboxState = {
	items: [],
	isSyncing: false,
	initialized: false,
};

export const OutboxContext = createContext<OutboxContextValue | null>(null);

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
			errorCount: service?.getErrorCount() ?? 0,
			enqueueDaily: async (input) => {
				await service?.enqueueDaily(input);
			},
			enqueueSubject: async (input) => {
				await service?.enqueueSubject(input);
			},
			flush: async (options) => {
				await service?.flush(options);
			},
			removeItem: async (id) => {
				await service?.removeItem(id);
			},
			getItem: (id) => service?.getItem(id),
			getItemForCourse: (courseId, date) =>
				service?.getItemForCourse(courseId, date),
			getItemForSubject: (subjectId, date) =>
				service?.getItemForSubject(subjectId, date),
		}),
		[state, service],
	);

	return (
		<OutboxContext.Provider value={value}>{children}</OutboxContext.Provider>
	);
}
