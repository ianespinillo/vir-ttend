import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from 'react';
import { Appearance, useColorScheme } from 'react-native';
import {
	DEFAULT_THEME_PREFERENCE,
	THEME_STORAGE_KEY,
	type ThemePreference,
	parseThemePreference,
	toAppearanceScheme,
} from './theme-preference';
import { type ColorScheme, resolveColorScheme } from './theme-tokens';

interface ThemeContextValue {
	preference: ThemePreference;
	/** Scheme currently rendered (system setting resolved). */
	scheme: ColorScheme;
	setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const applyPreference = (preference: ThemePreference) => {
	Appearance.setColorScheme(toAppearanceScheme(preference));
};

/**
 * Loads the saved theme preference (AsyncStorage `virttend:theme`, default
 * `system`) and applies it with `Appearance.setColorScheme`. NativeWind's
 * `dark:` variants and `useColorScheme` follow Appearance, so this is the only
 * switch. Mount it at the root, above `BrandProvider`.
 */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [preference, setPreferenceState] = useState<ThemePreference>(
		DEFAULT_THEME_PREFERENCE,
	);
	const scheme = resolveColorScheme(useColorScheme());

	useEffect(() => {
		let cancelled = false;
		AsyncStorage.getItem(THEME_STORAGE_KEY)
			.then((stored) => {
				if (cancelled) return;
				const parsed = parseThemePreference(stored);
				setPreferenceState(parsed);
				applyPreference(parsed);
			})
			.catch(() => {
				// Unreadable storage: keep following the system setting.
			});
		return () => {
			cancelled = true;
		};
	}, []);

	const setPreference = useCallback((next: ThemePreference) => {
		setPreferenceState(next);
		applyPreference(next);
		AsyncStorage.setItem(THEME_STORAGE_KEY, next).catch(() => {
			// Not persisted: the choice still applies for this session.
		});
	}, []);

	const value = useMemo<ThemeContextValue>(
		() => ({ preference, scheme, setPreference }),
		[preference, scheme, setPreference],
	);

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useThemePreference = (): ThemeContextValue => {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error('useThemePreference must be used within a ThemeProvider');
	}
	return context;
};
