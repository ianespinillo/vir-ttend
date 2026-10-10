/**
 * AsyncStorage keys of the offline read cache. Everything under this prefix is
 * disposable server data and is wiped on logout. Do NOT store user-authored,
 * not-yet-synced data (e.g. the attendance outbox) under it.
 */
export const OFFLINE_CACHE_PREFIX = 'virttend:cache:';

/** Identifies whose data the cache holds: one cache per user and school. */
export const buildSessionScope = (userId: string, tenantId: string): string =>
	`${userId}:${tenantId}`;

export const queryCacheKey = (scope: string): string =>
	`${OFFLINE_CACHE_PREFIX}query:${scope}`;

export const syncMetaKey = (scope: string): string =>
	`${OFFLINE_CACHE_PREFIX}sync:${scope}`;

export const isOfflineCacheKey = (key: string): boolean =>
	key.startsWith(OFFLINE_CACHE_PREFIX);
