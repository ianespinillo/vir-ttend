/**
 * Public runtime configuration of the demo.
 *
 * `NEXT_PUBLIC_*` variables are inlined at build time, so each access must
 * spell the variable out literally.
 */

const DEFAULT_SITE_URL = 'https://virttend.app';

/** Where "Conocé Vir-ttend" points (the `apps/site` deployment). */
export const siteUrl: string =
	process.env.NEXT_PUBLIC_SITE_URL?.trim() || DEFAULT_SITE_URL;
