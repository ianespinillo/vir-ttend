'use client';

import {
	type ReactNode,
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
} from 'react';
import { useIsomorphicLayoutEffect } from '../../hooks/use-isomorphic-layout-effect';
import {
	DARK_MEDIA_QUERY,
	type ResolvedTheme,
	THEME_STORAGE_KEY,
	type ThemePreference,
	isThemePreference,
	themeScript,
} from './theme-script';

interface ThemeContextValue {
	theme: ThemePreference;
	resolvedTheme: ResolvedTheme;
	setTheme: (theme: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
	theme: 'system',
	resolvedTheme: 'light',
	setTheme: () => {},
});

const readStoredTheme = (): ThemePreference | null => {
	try {
		const value = window.localStorage.getItem(THEME_STORAGE_KEY);
		return isThemePreference(value) ? value : null;
	} catch {
		return null;
	}
};

const writeStoredTheme = (theme: ThemePreference) => {
	try {
		window.localStorage.setItem(THEME_STORAGE_KEY, theme);
	} catch {
		// Storage can be unavailable (private mode, blocked site data): the theme still applies.
	}
};

const systemPrefersDark = (): boolean => {
	try {
		return window.matchMedia?.(DARK_MEDIA_QUERY).matches ?? false;
	} catch {
		return false;
	}
};

const applyTheme = (resolved: ResolvedTheme) => {
	const root = document.documentElement;
	root.classList.toggle('dark', resolved === 'dark');
	root.style.colorScheme = resolved;
};

export interface ThemeProviderProps {
	children: ReactNode;
	defaultTheme?: ThemePreference;
}

export function ThemeProvider({
	children,
	defaultTheme = 'system',
}: ThemeProviderProps) {
	const [theme, setThemeState] = useState<ThemePreference>(defaultTheme);
	const [systemDark, setSystemDark] = useState(false);

	// Read client-only state after hydration so server and client markup match.
	useIsomorphicLayoutEffect(() => {
		const stored = readStoredTheme();
		if (stored) setThemeState(stored);
		setSystemDark(systemPrefersDark());

		if (typeof window.matchMedia !== 'function') return;
		const mql = window.matchMedia(DARK_MEDIA_QUERY);
		const onChange = (event: { matches: boolean }) =>
			setSystemDark(event.matches);
		mql.addEventListener?.('change', onChange);
		return () => mql.removeEventListener?.('change', onChange);
	}, []);

	const resolvedTheme: ResolvedTheme =
		theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;

	useIsomorphicLayoutEffect(() => {
		applyTheme(resolvedTheme);
	}, [resolvedTheme]);

	const setTheme = useCallback((next: ThemePreference) => {
		setThemeState(next);
		writeStoredTheme(next);
	}, []);

	const value = useMemo(
		() => ({ theme, resolvedTheme, setTheme }),
		[theme, resolvedTheme, setTheme],
	);

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);

/** Render inside `<head>` to set the theme class before first paint. */
export function ThemeScript() {
	return <script dangerouslySetInnerHTML={{ __html: themeScript }} />;
}
