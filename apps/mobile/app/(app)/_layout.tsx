import { Stack, useRouter } from 'expo-router';
import { LogOut } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../src/context/auth-context';

export default function AppLayout() {
	const { user, logout } = useAuth();
	const router = useRouter();

	const handleLogout = async () => {
		await logout();
		router.replace('/(auth)/login');
	};

	return (
		<Stack
			screenOptions={{
				headerStyle: {
					backgroundColor: '#FFFFFF',
				},
				headerShadowVisible: false,
				headerTintColor: '#0F172A',
				headerTitleStyle: {
					fontWeight: '700',
				},
			}}
		>
			<Stack.Screen
				name="index"
				options={{
					headerTitle: () => (
						<View className="flex-row items-center space-x-2">
							<View className="h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
								<Text className="text-sm font-bold text-white">V</Text>
							</View>
							<Text className="ml-2 text-lg font-bold text-slate-900">Vir-ttend</Text>
						</View>
					),
					headerRight: () => (
						<TouchableOpacity
							onPress={handleLogout}
							className="flex-row items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5"
						>
							<LogOut size={16} color="#64748B" />
							<Text className="ml-1 text-xs font-semibold text-slate-600">Salir</Text>
						</TouchableOpacity>
					),
				}}
			/>
			<Stack.Screen
				name="attendance/[id]"
				options={{
					title: 'Pase de Lista',
					headerBackTitle: 'Atrás',
				}}
			/>
		</Stack>
	);
}
