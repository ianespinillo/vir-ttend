import { useRouter } from 'expo-router';
import {
	Building,
	Check,
	Globe,
	Info,
	LogOut,
	Save,
	School,
	ShieldAlert,
	Sliders,
	User,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
	Alert,
	ScrollView,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { TenancyMode } from '../../src/config/app-config';
import { useAuth } from '../../src/context/auth-context';

export default function SettingsScreen() {
	const { user, config, updateAppName, updateTenancyMode, logout } = useAuth();
	const router = useRouter();

	const [customNameInput, setCustomNameInput] = useState(config.appName);
	const [selectedMode, setSelectedMode] = useState<TenancyMode>(
		config.tenancyMode,
	);
	const [isSaving, setIsSaving] = useState(false);

	const handleSaveConfig = async () => {
		setIsSaving(true);
		try {
			await updateAppName(customNameInput);
			await updateTenancyMode(selectedMode);
			Alert.alert(
				'Configuración guardada',
				'Los cambios de entorno y nombre fueron actualizados correctamente.',
			);
		} catch (error) {
			Alert.alert('Error', 'No se pudieron guardar las preferencias.');
		} finally {
			setIsSaving(false);
		}
	};

	const handleLogout = async () => {
		await logout();
		router.replace('/(auth)/login');
	};

	return (
		<SafeAreaView edges={['bottom']} className="flex-1 bg-slate-50">
			<ScrollView className="flex-1 px-5 py-4">
				{/* User Profile Card */}
				<View className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
					<View className="flex-row items-center space-x-3.5">
						<View className="h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100">
							<User size={24} color="#4F46E5" />
						</View>
						<View className="ml-3 flex-1">
							<Text className="text-base font-bold text-slate-900">
								{user?.firstName} {user?.lastName}
							</Text>
							<Text className="text-xs text-slate-500">{user?.email}</Text>
							<View className="mt-1 flex-row items-center">
								<View className="rounded bg-indigo-50 px-2 py-0.5 border border-indigo-200">
									<Text className="text-[11px] font-bold uppercase text-indigo-700">
										Rol: {user?.role}
									</Text>
								</View>
							</View>
						</View>
					</View>
				</View>

				{/* Custom App & School Name */}
				<View className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
					<View className="mb-3 flex-row items-center space-x-2">
						<School size={18} color="#4F46E5" />
						<Text className="ml-2 text-base font-bold text-slate-800">
							Personalizar Nombre
						</Text>
					</View>
					<Text className="mb-3 text-xs text-slate-500">
						Podés cambiar el nombre que se muestra en la cabecera y el login (ej.
						nombre de tu colegio o proyecto).
					</Text>

					<TextInput
						className="rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-3 text-base text-slate-900 focus:border-indigo-600"
						placeholder="Nombre de la App / Institución"
						value={customNameInput}
						onChangeText={setCustomNameInput}
					/>
				</View>

				{/* Tenancy Mode Selector */}
				<View className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
					<View className="mb-3 flex-row items-center space-x-2">
						<Sliders size={18} color="#4F46E5" />
						<Text className="ml-2 text-base font-bold text-slate-800">
							Modo de Tenancy (Entorno)
						</Text>
					</View>
					<Text className="mb-4 text-xs text-slate-500">
						Configurá si la app opera ligada a una única institución educativa o
						permite conmutar entre múltiples colegios.
					</Text>

					{/* Single Tenant Option */}
					<TouchableOpacity
						onPress={() => setSelectedMode('single')}
						className={`mb-3 flex-row items-center justify-between rounded-xl border p-4 ${
							selectedMode === 'single'
								? 'border-indigo-600 bg-indigo-50/50'
								: 'border-slate-200 bg-white'
						}`}
					>
						<View className="flex-row items-center space-x-3">
							<Building
								size={20}
								color={selectedMode === 'single' ? '#4F46E5' : '#64748B'}
							/>
							<View className="ml-3">
								<Text className="text-sm font-bold text-slate-900">
									Single-Tenant (Institución Única)
								</Text>
								<Text className="text-xs text-slate-500">
									Login directo, sin selector de escuelas
								</Text>
							</View>
						</View>
						{selectedMode === 'single' && <Check size={18} color="#4F46E5" />}
					</TouchableOpacity>

					{/* Multi Tenant Option */}
					<TouchableOpacity
						onPress={() => setSelectedMode('multi')}
						className={`flex-row items-center justify-between rounded-xl border p-4 ${
							selectedMode === 'multi'
								? 'border-indigo-600 bg-indigo-50/50'
								: 'border-slate-200 bg-white'
						}`}
					>
						<View className="flex-row items-center space-x-3">
							<Globe
								size={20}
								color={selectedMode === 'multi' ? '#4F46E5' : '#64748B'}
							/>
							<View className="ml-3">
								<Text className="text-sm font-bold text-slate-900">
									Multi-Tenant (Múltiples Instituciones)
								</Text>
								<Text className="text-xs text-slate-500">
									Permite seleccionar y conmutar escuelas
								</Text>
							</View>
						</View>
						{selectedMode === 'multi' && <Check size={18} color="#4F46E5" />}
					</TouchableOpacity>

					{/* Save button */}
					<TouchableOpacity
						onPress={handleSaveConfig}
						disabled={isSaving}
						className="mt-5 flex-row items-center justify-center rounded-xl bg-indigo-600 py-3.5 active:bg-indigo-700"
					>
						<Save size={18} color="#FFFFFF" />
						<Text className="ml-2 text-sm font-bold text-white">
							Guardar Preferencias
						</Text>
					</TouchableOpacity>
				</View>

				{/* Role Policy Notice */}
				<View className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
					<View className="flex-row items-start space-x-2.5">
						<ShieldAlert size={18} color="#D97706" />
						<View className="ml-2 flex-1">
							<Text className="text-xs font-bold text-amber-900">
								Política de Seguridad de Roles
							</Text>
							<Text className="mt-0.5 text-xs text-amber-800">
								Esta aplicación restringe el ingreso exclusivamente a usuarios con rol
								Preceptor o Docente. Los administradores globales y alumnos son
								rechazados por seguridad.
							</Text>
						</View>
					</View>
				</View>

				{/* Logout Action */}
				<TouchableOpacity
					onPress={handleLogout}
					className="mb-8 flex-row items-center justify-center rounded-xl border border-red-200 bg-white py-3.5 active:bg-red-50"
				>
					<LogOut size={18} color="#EF4444" />
					<Text className="ml-2 text-sm font-bold text-red-600">Cerrar Sesión</Text>
				</TouchableOpacity>
			</ScrollView>
		</SafeAreaView>
	);
}
