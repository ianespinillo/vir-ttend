import {
	type BrandTokens,
	type PublicBranding,
	deriveBrandTokens,
	resolveAssetUrl,
} from '@repo/branding';
import { toNativeWindVars } from '@repo/branding/native';
import { vars } from 'nativewind';
import React, { createContext, useContext, useMemo } from 'react';
import { View } from 'react-native';
import { API_URL } from '../../config/app-config';
import { useAuth } from '../../context/auth-context';
import { useThemePreference } from '../theme/theme-provider';
import { toNeutralVars } from '../theme/theme-tokens';

interface BrandContextValue {
	branding: PublicBranding;
	tokens: BrandTokens;
	/** Resolves a branding asset path against the API origin. */
	assetUrl: (path: string | null) => string | null;
}

const BrandContext = createContext<BrandContextValue | undefined>(undefined);

/**
 * Publishes the instance branding. The `--brand-*` variables and the neutral
 * `--color-*` variables of the active color scheme are set on the root `View`
 * with NativeWind `vars()`, so `bg-primary`, `bg-card` & co. resolve to the
 * instance colors in light and dark; imperative props (lucide `color`,
 * `ActivityIndicator`, ...) read `useThemeColors()`. Must sit inside
 * `AuthProvider` and `ThemeProvider`.
 */
export const BrandProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const { config } = useAuth();
	const { branding } = config;
	const { scheme } = useThemePreference();

	const value = useMemo<BrandContextValue>(
		() => ({
			branding,
			tokens: deriveBrandTokens(branding.colors),
			assetUrl: (path) => resolveAssetUrl(path, API_URL),
		}),
		[branding],
	);
	const themeStyle = useMemo(
		() =>
			vars({
				...toNativeWindVars(value.tokens, scheme),
				...toNeutralVars(scheme),
			}),
		[value.tokens, scheme],
	);

	return (
		<BrandContext.Provider value={value}>
			<View style={[{ flex: 1 }, themeStyle]}>{children}</View>
		</BrandContext.Provider>
	);
};

export const useBrand = (): BrandContextValue => {
	const context = useContext(BrandContext);
	if (!context) {
		throw new Error('useBrand must be used within a BrandProvider');
	}
	return context;
};
