import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../global.css';
import { AuthProvider } from '../src/context/auth-context';

export default function RootLayout() {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						retry: 1,
						staleTime: 1000 * 60 * 5, // 5 minutes
					},
				},
			}),
	);

	return (
		<SafeAreaProvider>
			<QueryClientProvider client={queryClient}>
				<AuthProvider>
					<StatusBar style="dark" />
					<Stack screenOptions={{ headerShown: false }}>
						<Stack.Screen name="index" />
						<Stack.Screen name="(auth)/login" options={{ title: 'Iniciar Sesión' }} />
						<Stack.Screen
							name="(auth)/select-tenant"
							options={{ title: 'Seleccionar Escuela' }}
						/>
						<Stack.Screen name="(app)" />
					</Stack>
				</AuthProvider>
			</QueryClientProvider>
		</SafeAreaProvider>
	);
}
