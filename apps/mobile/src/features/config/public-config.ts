import { type PublicBranding, publicBrandingSchema } from '@repo/branding';
import type { TenancyMode } from '../../config/app-config';

/**
 * Deployment config published by the API at `GET /config/public`. The server
 * enforces the tenancy mode, so the app only reads it, never chooses it.
 */
export interface PublicConfig {
	tenancyMode: TenancyMode;
	tenantId: string | null;
	tenantName: string | null;
	tenantSlug: string | null;
	/** `null` when the server sent none (older API) or an invalid payload. */
	branding: PublicBranding | null;
}

/**
 * AsyncStorage key of the cached public config, one entry per API base URL.
 * It must NOT start with the offline cache prefix (`virttend:cache:`): logout
 * wipes that prefix, and the school identity is not user data.
 */
export const SERVER_CONFIG_PREFIX = 'virttend:server-config:';

export const publicConfigStorageKey = (apiUrl: string): string =>
	`${SERVER_CONFIG_PREFIX}${apiUrl}`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

const nonEmptyString = (value: unknown): string | null =>
	typeof value === 'string' && value.trim() ? value.trim() : null;

/**
 * Validates a `/config/public` payload. Accepts the raw body and the wrapped
 * `{ success, data, timeStamp }` envelope. Returns `null` when the shape is not
 * usable (unknown tenancy mode), so a bad response never replaces a good cache.
 * Pure.
 */
export const parsePublicConfig = (raw: unknown): PublicConfig | null => {
	const payload =
		isRecord(raw) && isRecord(raw.data) && !('tenancyMode' in raw)
			? raw.data
			: raw;
	if (!isRecord(payload)) return null;

	const { tenancyMode } = payload;
	if (tenancyMode !== 'single' && tenancyMode !== 'multi') return null;

	// An invalid branding never discards the rest of the config.
	const branding = publicBrandingSchema.safeParse(payload.branding);

	return {
		tenancyMode,
		tenantId: nonEmptyString(payload.tenantId),
		tenantName: nonEmptyString(payload.tenantName),
		tenantSlug: nonEmptyString(payload.tenantSlug),
		branding: branding.success ? branding.data : null,
	};
};

export const serializeCachedPublicConfig = (config: PublicConfig): string =>
	JSON.stringify({ config, savedAt: new Date().toISOString() });

/** Reads what `serializeCachedPublicConfig` wrote. Never throws. Pure. */
export const parseCachedPublicConfig = (
	stored: string | null,
): PublicConfig | null => {
	if (!stored) return null;
	try {
		const parsed: unknown = JSON.parse(stored);
		return isRecord(parsed) ? parsePublicConfig(parsed.config) : null;
	} catch {
		return null;
	}
};
