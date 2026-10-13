import { useCallback, useEffect, useRef, useState } from 'react';
import { useIsOnline } from '../offline/use-is-online';
import type { PublicConfig } from './public-config';
import {
	fetchPublicConfig,
	loadCachedPublicConfig,
	saveCachedPublicConfig,
} from './public-config-service';

/**
 * - `loading`: nothing known yet.
 * - `fresh`: read from the server during this app run.
 * - `cached`: the server could not be reached; showing the last saved copy.
 * - `unavailable`: no server answer and nothing cached.
 */
export type ServerConfigStatus = 'loading' | 'fresh' | 'cached' | 'unavailable';

interface ServerConfigState {
	config: PublicConfig | null;
	status: ServerConfigStatus;
}

export interface ServerConfig extends ServerConfigState {
	/** Re-reads the config from the server. Resolves `null` when it fails. */
	refresh: () => Promise<PublicConfig | null>;
}

/**
 * The server's public config: cached copy first (works offline), then the
 * network in the background, again whenever the device comes back online.
 */
export const useServerConfig = (): ServerConfig => {
	const [state, setState] = useState<ServerConfigState>({
		config: null,
		status: 'loading',
	});
	const stateRef = useRef(state);
	stateRef.current = state;
	const inFlight = useRef<Promise<PublicConfig | null> | null>(null);
	const online = useIsOnline();

	const refresh = useCallback((): Promise<PublicConfig | null> => {
		if (!inFlight.current) {
			inFlight.current = (async () => {
				try {
					const fresh = await fetchPublicConfig();
					void saveCachedPublicConfig(fresh);
					setState({ config: fresh, status: 'fresh' });
					return fresh;
				} catch (error) {
					console.warn('Could not read the server config', error);
					setState((prev) =>
						prev.config
							? { config: prev.config, status: 'cached' }
							: { config: null, status: 'unavailable' },
					);
					return null;
				} finally {
					inFlight.current = null;
				}
			})();
		}
		return inFlight.current;
	}, []);

	useEffect(() => {
		let cancelled = false;
		const start = async () => {
			const cached = await loadCachedPublicConfig();
			if (!cancelled && cached) {
				// A fresh answer that already arrived wins over the cached copy.
				setState((prev) =>
					prev.status === 'fresh' ? prev : { config: cached, status: 'cached' },
				);
			}
			await refresh();
		};
		void start();
		return () => {
			cancelled = true;
		};
	}, [refresh]);

	useEffect(() => {
		if (online && stateRef.current.status !== 'fresh') void refresh();
	}, [online, refresh]);

	return { ...state, refresh };
};
