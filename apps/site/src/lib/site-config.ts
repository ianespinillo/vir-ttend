/**
 * Public runtime configuration of the site.
 *
 * Every value comes from a `NEXT_PUBLIC_*` variable that Next.js inlines at
 * build time, so each access must spell the variable out literally.
 */

const DEFAULT_DEMO_URL = 'https://demo.virttend.app';
const DEFAULT_CONTACT_EMAIL = 'espinilloian@hotmail.com';
const LOCAL_SITE_URL = 'http://localhost:3002';

const clean = (value: string | undefined): string | null => {
	const trimmed = value?.trim();
	return trimmed ? trimmed : null;
};

const stripTrailingSlash = (url: string) => url.replace(/\/+$/, '');

/**
 * Accepts a bare domain (`vir-ttend.app`) as well as a full URL, so a value
 * pasted without a scheme does not crash `new URL()` in the metadata base.
 */
const withScheme = (url: string) =>
	/^https?:\/\//i.test(url) ? url : `https://${url}`;

/** Explicit site URL, or the Vercel production domain when deployed there. */
const resolveSiteUrl = (): string | null => {
	const explicit = clean(process.env.NEXT_PUBLIC_SITE_URL);
	if (explicit) return stripTrailingSlash(withScheme(explicit));
	const vercelHost = clean(process.env.VERCEL_PROJECT_PRODUCTION_URL);
	return vercelHost ? `https://${vercelHost}` : null;
};

const siteUrl = resolveSiteUrl();

export const siteConfig = {
	name: 'Vir-ttend',
	description:
		'Asistencia escolar simple, online y offline: pase de lista diario y por materia, justificaciones, alertas tempranas y reportes.',
	/** Absolute site URL, or null when it is not configured. */
	siteUrl,
	/** Base for URLs that must be absolute even without configuration. */
	siteUrlOrLocal: siteUrl ?? LOCAL_SITE_URL,
	demoUrl: stripTrailingSlash(
		withScheme(clean(process.env.NEXT_PUBLIC_DEMO_URL) ?? DEFAULT_DEMO_URL),
	),
	/** Login entry of the shared instance. The "Ingresar" button hides when null. */
	appUrl: clean(process.env.NEXT_PUBLIC_APP_URL),
	contactEmail:
		clean(process.env.NEXT_PUBLIC_CONTACT_EMAIL) ?? DEFAULT_CONTACT_EMAIL,
} as const;

export const contactMailto = (subject: string): string =>
	`mailto:${siteConfig.contactEmail}?subject=${encodeURIComponent(subject)}`;
