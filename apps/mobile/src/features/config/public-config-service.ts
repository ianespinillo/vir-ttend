import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../config/app-config';
import { api } from '../../services/api';
import {
	type PublicConfig,
	parseCachedPublicConfig,
	parsePublicConfig,
	publicConfigStorageKey,
	serializeCachedPublicConfig,
} from './public-config';

const CONFIG_KEY = publicConfigStorageKey(API_URL);

/** The last config saved for this API server, or `null`. Never rejects. */
export const loadCachedPublicConfig =
	async (): Promise<PublicConfig | null> => {
		try {
			return parseCachedPublicConfig(await AsyncStorage.getItem(CONFIG_KEY));
		} catch (error) {
			console.warn('Could not read the cached server config', error);
			return null;
		}
	};

/** Best effort: a failed write only costs the offline copy. */
export const saveCachedPublicConfig = async (
	config: PublicConfig,
): Promise<void> => {
	try {
		await AsyncStorage.setItem(CONFIG_KEY, serializeCachedPublicConfig(config));
	} catch (error) {
		console.warn('Could not cache the server config', error);
	}
};

/** Asks the server for its config. Rejects on network errors or an unusable body. */
export const fetchPublicConfig = async (): Promise<PublicConfig> => {
	const res = await api.get('/config/public');
	const config = parsePublicConfig(res.data);
	if (!config) {
		throw new Error('The server returned an unusable public config');
	}
	return config;
};
