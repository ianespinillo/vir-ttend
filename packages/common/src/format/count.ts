/**
 * Formats an absence count for display. Weighted counts move in 0.25 steps, so
 * they can be fractional: whole numbers print as such ("10") and fractions use
 * the Spanish decimal comma with up to 2 decimals ("12,5", "10,25"). Pure string
 * work, so it behaves the same on the API, the web and React Native (Hermes has
 * no full Intl). Rounds only the printed value, never the count itself.
 */
export function formatCount(value: number): string {
	const rounded = Math.round(value * 100) / 100;
	return String(rounded).replace('.', ',');
}
