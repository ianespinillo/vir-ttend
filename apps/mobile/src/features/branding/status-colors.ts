import type { StatusTone } from '../theme/theme-tokens';

/**
 * Fixed colors for statuses that are NOT brand: the instance's primary never
 * changes them. This is the only file allowed to contain indigo ("justificado"
 * and "sincronizando" use it as a status color). Applied through inline `style`
 * (NativeWind classNames stay static); pick the tone for the active scheme with
 * `useThemeColors().status.justified`.
 */
export const JUSTIFIED_TONE: StatusTone = {
	background: '#EEF2FF',
	border: '#C7D2FE',
	text: '#4338CA',
	strongText: '#3730A3',
	icon: '#6366F1',
};

/** Dark-scheme variant: same hue, translucent tint and lighter ink. */
export const JUSTIFIED_TONE_DARK: StatusTone = {
	background: 'rgba(99, 102, 241, 0.16)',
	border: 'rgba(99, 102, 241, 0.4)',
	text: '#A5B4FC',
	strongText: '#C7D2FE',
	icon: '#818CF8',
};
