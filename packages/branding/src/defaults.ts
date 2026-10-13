import type { PublicBranding } from './schema.js';

export const VIRTTEND_COLORS = { navy: '#14213D', lime: '#C6F432' } as const;
export const INK = '#14213D';

export const VIRTTEND_BRANDING: PublicBranding = {
	source: 'virttend',
	version: 'virttend-1',
	displayName: 'Vir-ttend',
	shortName: 'Vir-ttend',
	colors: {
		primary: VIRTTEND_COLORS.navy,
		accent: VIRTTEND_COLORS.lime,
		highlight: null,
	},
	assets: { crest: null, crestSmall: null, crestSmallPng: null, favicon: null },
	showPoweredBy: false,
};
