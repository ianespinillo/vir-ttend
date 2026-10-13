export type Hex = `#${string}`;

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

export const isHex = (v: string): v is Hex => HEX_RE.test(v);

export const normalizeHex = (h: string): Hex => h.toUpperCase() as Hex;

const toRgb = (h: string) => {
	const n = Number.parseInt(h.slice(1), 16);
	return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
};

const toHex = (r: number, g: number, b: number): Hex =>
	`#${[r, g, b]
		.map((c) => Math.round(c).toString(16).padStart(2, '0'))
		.join('')}`.toUpperCase() as Hex;

/** Mezcla `a` hacia `b` con peso `t` (0 = a, 1 = b). */
export const mix = (a: string, b: string, t: number): Hex => {
	const x = toRgb(a);
	const y = toRgb(b);
	return toHex(
		x[0] + (y[0] - x[0]) * t,
		x[1] + (y[1] - x[1]) * t,
		x[2] + (y[2] - x[2]) * t,
	);
};

export const relativeLuminance = (h: string): number => {
	const ch = (c: number) => {
		const s = c / 255;
		return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
	};
	const [r, g, b] = toRgb(h);
	return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
};

export const contrastRatio = (a: string, b: string): number => {
	const [hi = 0, lo = 0] = [relativeLuminance(a), relativeLuminance(b)].sort(
		(p, q) => q - p,
	);
	return (hi + 0.05) / (lo + 0.05);
};

/** Rounds to 1 decimal and drops trailing zeros ("84", "47.4"), like the shadcn values. */
const fmt = (n: number): string => String(Math.round(n * 10) / 10);

/** "H S% L%" (formato shadcn), 1 decimal sin ceros finales. */
export const hexToHslTriplet = (h: string): string => {
	const [r8, g8, b8] = toRgb(h);
	const r = r8 / 255;
	const g = g8 / 255;
	const b = b8 / 255;
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const d = max - min;
	const l = (max + min) / 2;
	let hue = 0;
	let s = 0;
	if (d !== 0) {
		s = d / (1 - Math.abs(2 * l - 1));
		if (max === r) hue = ((g - b) / d) % 6;
		else if (max === g) hue = (b - r) / d + 2;
		else hue = (r - g) / d + 4;
		hue *= 60;
		if (hue < 0) hue += 360;
	}
	return `${fmt(hue)} ${fmt(s * 100)}% ${fmt(l * 100)}%`;
};

/** "R G B" (formato rgb(var() / <alpha-value>) de NativeWind). */
export const hexToRgbTriplet = (h: string): string => toRgb(h).join(' ');
