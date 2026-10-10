import { useRouter } from 'expo-router';
import { ArrowRight, Building, LogOut } from 'lucide-react-native';
import React, { useState } from 'react';
import {
	ActivityIndicator,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/auth-context';

export default function SelectTenantScreen() {
	const { availableTenants, selectTenant, logout } = useAuth();
	const router = useRouter();
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSelect = async (tenantId: string) => {
		setSelectedId(tenantId);
		setIsSubmitting(true);
		setError(null);
		try {
			await selectTenant(tenantId);
			router.replace('/(app)');
		} catch (err: unknown) {
			const error = err as { message?: string };
			setError(error?.message || 'Error al conectar con la institución');
			setIsSubmitting(false);
		}
	};

	const handleLogout = async () => {
		await logout();
		router.replace('/(auth)/login');
	};

	return (
		<SafeAreaView className="flex-1 bg-slate-50 px-6 py-6">
			<View className="mb-6 flex-row items-center justify-between">
				<View>
					<Text className="text-2xl font-bold text-slate-900">Elegir Escuela</Text>
					<Text className="mt-1 text-sm text-slate-500">
						Seleccioná la institución para operar en esta sesión
					</Text>
				</View>
				<TouchableOpacity
					onPress={handleLogout}
					className="flex-row items-center rounded-lg border border-slate-200 bg-white px-3 py-2"
				>
					<LogOut size={16} color="#64748B" />
				</TouchableOpacity>
			</View>

			{error && (
				<View className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3">
					<Text className="text-sm font-medium text-red-700">{error}</Text>
				</View>
			)}

			<ScrollView className="flex-1 space-y-3">
				{availableTenants.map((t) => {
					const isThisSelected = isSubmitting && selectedId === t.tenantId;
					return (
						<TouchableOpacity
							key={t.tenantId}
							onPress={() => handleSelect(t.tenantId)}
							disabled={isSubmitting}
							className="mb-3 flex-row items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm active:border-indigo-400"
						>
							<View className="flex-row items-center space-x-3.5">
								<View className="h-12 w-12 items-center justify-center rounded-xl bg-indigo-50">
									<Building size={22} color="#4F46E5" />
								</View>
								<View className="ml-3">
									<Text className="text-base font-semibold text-slate-800">
										{t.name || 'Institución Educativa'}
									</Text>
									<Text className="text-xs uppercase tracking-wide text-indigo-600">
										Rol: {t.role || 'Docente'}
									</Text>
								</View>
							</View>

							{isThisSelected ? (
								<ActivityIndicator size="small" color="#4F46E5" />
							) : (
								<ArrowRight size={20} color="#94A3B8" />
							)}
						</TouchableOpacity>
					);
				})}

				{availableTenants.length === 0 && (
					<View className="items-center justify-center py-12">
						<Text className="text-sm text-slate-500">
							No se encontraron instituciones asignadas a tu cuenta.
						</Text>
					</View>
				)}
			</ScrollView>
		</SafeAreaView>
	);
}
