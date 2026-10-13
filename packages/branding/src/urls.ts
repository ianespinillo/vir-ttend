const ORIGIN_RE = /^(https?:\/\/[^/]+)/;
const ABSOLUTE_RE = /^https?:\/\//;

/**
 * Resolves a branding asset path against the API origin. No `URL` (Hermes).
 * A relative `apiUrl` (e.g. `/api`) means same origin, so the path is returned as is.
 */
export const resolveAssetUrl = (
	path: string | null,
	apiUrl: string,
): string | null => {
	if (path === null) return null;
	if (ABSOLUTE_RE.test(path)) return path;
	const origin = ORIGIN_RE.exec(apiUrl)?.[1];
	return origin ? `${origin}${path}` : path;
};
