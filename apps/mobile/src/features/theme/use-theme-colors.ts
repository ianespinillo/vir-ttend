import { useMemo } from 'react';
import { useBrand } from '../branding/brand-context';
import { useThemePreference } from './theme-provider';
import { type ThemePalette, getThemePalette } from './theme-tokens';

/**
 * Colors for imperative props (lucide `color`, `ActivityIndicator`,
 * `placeholderTextColor`, inline `style`) for the active scheme. Use the
 * NativeWind tokens (`bg-card`, `text-primary-ink`, ...) for classNames.
 */
export const useThemeColors = (): ThemePalette => {
	const { tokens } = useBrand();
	const { scheme } = useThemePreference();
	return useMemo(() => getThemePalette(scheme, tokens), [scheme, tokens]);
};
