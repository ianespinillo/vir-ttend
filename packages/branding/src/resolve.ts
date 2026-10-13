import { VIRTTEND_BRANDING } from './defaults.js';
import type { BrandingFile, PublicBranding } from './schema.js';

export const BRANDING_URL_PREFIX = '/branding';

export interface ResolveBrandingInput {
	mode: 'single' | 'multi';
	instance: { file: BrandingFile; version: string } | null;
}

export const resolveBranding = ({
	mode,
	instance,
}: ResolveBrandingInput): PublicBranding => {
	if (mode === 'multi' || !instance) return VIRTTEND_BRANDING;
	const { file, version } = instance;
	const url = (name: string | undefined): string | null =>
		name ? `${BRANDING_URL_PREFIX}/${name}?v=${version}` : null;
	return {
		source: 'instance',
		version,
		displayName: file.displayName,
		shortName: file.shortName,
		colors: {
			primary: file.colors.primary,
			accent: file.colors.accent ?? null,
			highlight: file.colors.highlight ?? null,
		},
		assets: {
			crest: url(file.assets.crest),
			crestSmall: url(file.assets.crestSmall),
			crestSmallPng: url(file.assets.crestSmallPng),
			favicon: url(file.assets.favicon),
		},
		showPoweredBy: true,
	};
};
