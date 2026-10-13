import { mobileApps } from '@/config/mobile-apps';
import { siteConfig } from '@/lib/site-config';
import type { MetadataRoute } from 'next';

// /privacidad is intentionally left out while the policy is a draft (noindex).
export default function sitemap(): MetadataRoute.Sitemap {
	const base = siteConfig.siteUrlOrLocal;
	return [
		{ url: `${base}/`, changeFrequency: 'monthly', priority: 1 },
		{ url: `${base}/descargar`, changeFrequency: 'monthly', priority: 0.6 },
		...mobileApps.schools.map((school) => ({
			url: `${base}/descargar/${school.slug}`,
			changeFrequency: 'monthly' as const,
			priority: 0.4,
		})),
	];
}
