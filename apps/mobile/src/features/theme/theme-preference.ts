/** User's theme choice; `system` follows the device setting. */
export type ThemePreference = 'light' | 'dark' | 'system';

export const THEME_STORAGE_KEY = 'virttend:theme';

export const DEFAULT_THEME_PREFERENCE: ThemePreference = 'system';

export const THEME_OPTIONS: ReadonlyArray<{
	value: ThemePreference;
	label: string;
}> = [
	{ value: 'light', label: 'Claro' },
	{ value: 'dark', label: 'Oscuro' },
	{ value: 'system', label: 'Sistema' },
];

/** Reads a stored value; anything unknown falls back to `system`. */
export const parseThemePreference = (
	value: string | null | undefined,
): ThemePreference =>
	value === 'light' || value === 'dark' || value === 'system'
		? value
		: DEFAULT_THEME_PREFERENCE;

/** Value for React Native `Appearance.setColorScheme` (`unspecified` = system). */
export const toAppearanceScheme = (
	preference: ThemePreference,
): 'light' | 'dark' | 'unspecified' =>
	preference === 'system' ? 'unspecified' : preference;
