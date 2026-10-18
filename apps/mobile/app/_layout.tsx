import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider as NavigationThemeProvider,
	Stack,
} from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useMemo } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../global.css';
import { AuthProvider } from '../src/context/auth-context';
import { BrandProvider } from '../src/features/branding/brand-context';
import { AppQueryProvider } from '../src/features/offline/query-provider';
import {
	ThemeProvider,
	useThemePreference,
} from '../src/features/theme/theme-provider';
import { getNeutrals } from '../src/features/theme/theme-tokens';

/**
 * Navigation theme + status bar for the active scheme. Light keeps React
 * Navigation's default theme (as before dark mode); dark uses the app neutrals
 * so screen transitions and headers never flash a light background.
 */
function ThemedNavigation({ children }: { children: React.JSX.Element }) {
	const { scheme } = useThemePreference();
	const navigationTheme = useMemo(() => {
		if (scheme === 'light') return DefaultTheme;
		const neutrals = getNeutrals('dark');
		return {
			...DarkTheme,
			colors: {
				...DarkTheme.colors,
				background: neutrals.background,
				card: neutrals.card,
				text: neutrals.foreground,
				border: neutrals.border,
			},
		};
	}, [scheme]);

	return (
		<NavigationThemeProvider value={navigationTheme}>
			<StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
			{children}
		</NavigationThemeProvider>
	);
}

export default function RootLayout() {
	return (
		<SafeAreaProvider>
			<ThemeProvider>
				<AuthProvider>
					<BrandProvider>
						<AppQueryProvider>
							<ThemedNavigation>
								<Stack screenOptions={{ headerShown: false }}>
									<Stack.Screen name="index" />
									<Stack.Screen
										name="(auth)/login"
										options={{ title: 'Iniciar Sesión' }}
									/>
									<Stack.Screen
										name="(auth)/select-tenant"
										options={{ title: 'Seleccionar Escuela' }}
									/>
									<Stack.Screen name="(app)" />
								</Stack>
							</ThemedNavigation>
						</AppQueryProvider>
					</BrandProvider>
				</AuthProvider>
			</ThemeProvider>
		</SafeAreaProvider>
	);
}
