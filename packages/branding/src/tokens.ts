import { type Hex, contrastRatio, mix, normalizeHex } from './color.js';
import { INK, VIRTTEND_BRANDING } from './defaults.js';

export const SCALE = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;
export type ScaleStep = (typeof SCALE)[number];

export interface BrandTokens {
	primary: Hex;
	onPrimary: Hex;
	scale: Record<ScaleStep, Hex>;
	accent: Hex;
	onAccent: Hex;
	usable: boolean;
}

const TINT: Partial<Record<ScaleStep, number>> = {
	50: 0.92,
	100: 0.84,
	200: 0.68,
	300: 0.5,
	400: 0.32,
	500: 0.14,
};
const SHADE: Partial<Record<ScaleStep, number>> = {
	700: 0.15,
	800: 0.3,
	900: 0.45,
};

const pickOn = (bg: string) => {
	const w = contrastRatio(bg, '#FFFFFF');
	const k = contrastRatio(bg, INK);
	return { on: (w >= k ? '#FFFFFF' : INK) as Hex, ratio: Math.max(w, k) };
};

const build = (c: { primary: string; accent?: string | null }): BrandTokens => {
	const primary = normalizeHex(c.primary);
	const scale = Object.fromEntries(
		SCALE.map((s) => [
			s,
			s === 600
				? primary
				: TINT[s] !== undefined
					? mix(primary, '#FFFFFF', TINT[s] as number)
					: mix(primary, '#000000', SHADE[s] as number),
		]),
	) as Record<ScaleStep, Hex>;
	const p = pickOn(primary);
	const accent = normalizeHex(c.accent ?? scale[400]);
	return {
		primary,
		onPrimary: p.on,
		scale,
		accent,
		onAccent: pickOn(accent).on,
		usable: p.ratio >= 4.5,
	};
};

export const deriveBrandTokens = (c: {
	primary: string;
	accent?: string | null;
}): BrandTokens => {
	const t = build(c);
	return t.usable ? t : { ...build(VIRTTEND_BRANDING.colors), usable: false };
};
