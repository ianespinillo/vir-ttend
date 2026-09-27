'use client';

/**
 * Demo session provider.
 *
 * Owns a single DemoStore instance (hydrated from localStorage or freshly
 * seeded) and exposes it through React context via useDemo().
 *
 * Subscription strategy (no re-render storms): the provider subscribes ONCE
 * with useSyncExternalStore. The store notifies exactly once per commit, so
 * the context value changes at most once per mutation; every consumer that
 * reads `state` (or `session`) re-renders at most once per commit.
 *
 * Persistence is automatic: every store action commits state, persists it to
 * localStorage and notifies listeners. enterAs/exitSession/resetDemo are thin
 * wrappers over the corresponding store actions.
 */

import {
	type ReactNode,
	createContext,
	useCallback,
	useContext,
	useMemo,
	useRef,
	useSyncExternalStore,
} from 'react';
import * as demoSelectors from '../store/selectors';
import { getSession } from '../store/selectors';
import { type DemoStore, createDemoStore } from '../store/store';
import type { DemoState } from '../store/types';

export interface DemoContextValue {
	/** Latest committed state snapshot (re-renders on every store commit). */
	state: DemoState;
	/** Session user + tenant derived from state (getSession selector). */
	session: ReturnType<typeof getSession>;
	/** The live store instance: getState, subscribe and every action dispatcher. */
	store: DemoStore;
	/** Enter the demo as one of the seeded profiles (sets + persists session). */
	enterAs: (profileId: string) => void;
	/** Clear the demo session (back to the landing). */
	exitSession: () => void;
	/** Re-seed the canonical state (wipes localStorage + fresh seed). */
	resetDemo: () => void;
	/**
	 * Pure selectors over DemoState — pass the `state` value from this hook
	 * as the first argument, e.g. selectors.getStudents(state, { page: 1 }).
	 */
	selectors: typeof demoSelectors;
}

const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
	// Create the store once per provider mount; it hydrates from localStorage
	// (loadState) or falls back to the deterministic seed.
	const storeRef = useRef<DemoStore | null>(null);
	if (storeRef.current === null) {
		storeRef.current = createDemoStore();
	}
	const store = storeRef.current;

	const state = useSyncExternalStore(
		store.subscribe,
		store.getState,
		store.getState,
	);

	const enterAs = useCallback(
		(profileId: string) => store.setSession(profileId),
		[store],
	);
	const exitSession = useCallback(() => store.clearSession(), [store]);
	const resetDemo = useCallback(() => store.resetDemoState(), [store]);

	const value = useMemo<DemoContextValue>(
		() => ({
			state,
			session: getSession(state),
			store,
			enterAs,
			exitSession,
			resetDemo,
			selectors: demoSelectors,
		}),
		[state, store, enterAs, exitSession, resetDemo],
	);

	return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoContextValue {
	const context = useContext(DemoContext);
	if (!context) {
		throw new Error('useDemo must be used within a <DemoProvider>');
	}
	return context;
}
