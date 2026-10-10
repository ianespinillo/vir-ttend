import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useAuth } from '../src/context/auth-context';

export default function IndexScreen() {
	const { user, token, isLoading } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (isLoading) return;

		if (user && token) {
			router.replace('/(app)');
		} else {
			router.replace('/(auth)/login');
		}
	}, [user, token, isLoading, router]);

	return (
		<View className="flex-1 items-center justify-center bg-slate-50">
			<View className="items-center space-y-4">
				<View className="h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 shadow-md">
					<Text className="text-2xl font-bold text-white">V</Text>
				</View>
				<Text className="text-xl font-bold tracking-tight text-slate-900">
					Vir-ttend
				</Text>
				<ActivityIndicator size="small" color="#4F46E5" />
			</View>
		</View>
	);
}
