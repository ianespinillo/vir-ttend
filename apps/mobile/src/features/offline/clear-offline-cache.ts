import AsyncStorage from '@react-native-async-storage/async-storage';
import { isOfflineCacheKey } from './cache-keys';

/**
 * Removes every persisted offline cache entry (all users and schools).
 * Never rejects: callers are sign-out paths that must not be blocked by storage.
 */
export const clearAllOfflineCaches = async (): Promise<void> => {
	try {
		const keys = await AsyncStorage.getAllKeys();
		const cacheKeys = keys.filter(isOfflineCacheKey);
		if (cacheKeys.length > 0) {
			await AsyncStorage.multiRemove(cacheKeys);
		}
	} catch (error) {
		console.warn('Could not clear the offline cache', error);
	}
};
