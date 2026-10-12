/**
 * Fixed colors for statuses that are NOT brand: the instance's primary never
 * changes them. This is the only file allowed to contain indigo ("justificado"
 * uses it as a status color). Applied through inline `style` (NativeWind
 * classNames stay static).
 */
export const JUSTIFIED_TONE = {
	background: '#EEF2FF',
	border: '#C7D2FE',
	text: '#4338CA',
} as const;
