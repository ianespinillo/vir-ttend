/**
 * Mobile app download links: the source of truth for the download pages.
 *
 * To publish a link, fill in its URL and redeploy the site. Every `null`
 * renders as a "Próximamente" state, so nothing is advertised before it exists.
 *
 * Store-listing URLs win over the fallbacks: when both a store URL and a
 * fallback (APK / TestFlight) are set, the store button is primary and the
 * fallback is shown as a secondary option.
 */

export interface AndroidDownloads {
	/** Google Play listing, e.g. https://play.google.com/store/apps/details?id=... */
	playStoreUrl: string | null;
	/** Direct APK, e.g. an EAS internal-distribution link. Sideload only. */
	apkUrl: string | null;
}

export interface IosDownloads {
	/** App Store listing, e.g. https://apps.apple.com/app/id... */
	appStoreUrl: string | null;
	/** Public TestFlight invitation, e.g. https://testflight.apple.com/join/... */
	testFlightUrl: string | null;
}

export interface AppDownloads {
	android: AndroidDownloads;
	ios: IosDownloads;
}

export interface SchoolApp {
	/** URL segment of `/descargar/<slug>`. Matches the mobile `APP_VARIANT`. */
	slug: string;
	/** Full institutional name. */
	name: string;
	shortName: string;
	/** Path under `public/` of the school crest, if any. */
	crest?: string;
	downloads: AppDownloads;
}

export interface MobileApps {
	/** The Vir-ttend app for the shared multi-school server (com.virttend.app). */
	general: AppDownloads;
	/** One app per school with a dedicated server. */
	schools: SchoolApp[];
}

const NOT_PUBLISHED: AppDownloads = {
	android: { playStoreUrl: null, apkUrl: null },
	ios: { appStoreUrl: null, testFlightUrl: null },
};

export const mobileApps: MobileApps = {
	general: NOT_PUBLISHED,
	schools: [
		{
			// com.virttend.eest3
			slug: 'eest3',
			name: 'Escuela de Educación Secundaria Técnica N.º 3 «Eva Perón»',
			shortName: 'EEST N.º 3 Eva Perón',
			crest: '/schools/eest3/crest.png',
			downloads: NOT_PUBLISHED,
		},
	],
};

export const findSchoolApp = (slug: string): SchoolApp | undefined =>
	mobileApps.schools.find((school) => school.slug === slug);
