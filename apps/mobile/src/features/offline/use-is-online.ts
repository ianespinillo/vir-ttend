import { onlineManager } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';

const subscribe = (onChange: () => void): (() => void) =>
	onlineManager.subscribe(onChange);
const getSnapshot = (): boolean => onlineManager.isOnline();

/** Connectivity as seen by React Query (NetInfo-backed, see `query-client.ts`). */
export const useIsOnline = (): boolean =>
	useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
