export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'virttend:theme';
export const THEME_PREFERENCES: readonly ThemePreference[] = [
	'light',
	'dark',
	'system',
];
export const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)';

export const isThemePreference = (value: unknown): value is ThemePreference =>
	typeof value === 'string' &&
	(THEME_PREFERENCES as readonly string[]).includes(value);

/**
 * Inline script for `<head>`: applies the stored theme before first paint so
 * dark mode does not flash light. Mirrors `ThemeProvider` and never throws.
 */
export const themeScript = `(function(){try{var d=document.documentElement,t=null;try{t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})}catch(e){}if(t!=='light'&&t!=='dark'){t=window.matchMedia&&window.matchMedia(${JSON.stringify(DARK_MEDIA_QUERY)}).matches?'dark':'light'}d.classList.toggle('dark',t==='dark');d.style.colorScheme=t}catch(e){}})();`;
