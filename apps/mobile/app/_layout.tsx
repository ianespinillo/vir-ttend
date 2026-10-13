import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../global.css';
import { AuthProvider } from '../src/context/auth-context';
import { BrandProvider } from '../src/features/branding/brand-context';
import { AppQueryProvider } from '../src/features/offline/query-provider';

export default function RootLayout() {
	return (
		<SafeAreaProvider>
			<AuthProvider>
				<BrandProvider>
					<AppQueryProvider>
						<StatusBar style="dark" />
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
					</AppQueryProvider>
				</BrandProvider>
			</AuthProvider>
		</SafeAreaProvider>
	);
}
