import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useAuth } from '../src/context/auth-context';
import { useBrand } from '../src/features/branding/brand-context';
import { BrandMark } from '../src/features/branding/brand-mark';
import { useThemeColors } from '../src/features/theme/use-theme-colors';

export default function IndexScreen() {
	const { branding } = useBrand();
	const theme = useThemeColors();
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
		<View className="flex-1 items-center justify-center bg-background">
			<View className="items-center space-y-4">
				<BrandMark size="lg" />
				<Text className="text-xl font-bold tracking-tight text-foreground">
					{branding.shortName}
				</Text>
				<ActivityIndicator size="small" color={theme.primaryInk} />
			</View>
		</View>
	);
}
