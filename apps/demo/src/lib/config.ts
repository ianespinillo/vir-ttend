/**
 * Public runtime configuration of the demo.
 *
 * `NEXT_PUBLIC_*` variables are inlined at build time, so each access must
 * spell the variable out literally.
 */

/** Placeholder until the public site has its final URL. */
const DEFAULT_SITE_URL = 'https://vir-ttend.vercel.app';

/** Where "Conocé Vir-ttend" points (the `apps/site` deployment). */
export const siteUrl: string =
	process.env.NEXT_PUBLIC_SITE_URL?.trim() || DEFAULT_SITE_URL;
