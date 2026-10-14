import { useRouter } from 'expo-router';
import {
	LogOut,
	type LucideIcon,
	School,
	Server,
	ShieldAlert,
	Sliders,
	Smartphone,
	User,
} from 'lucide-react-native';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { APP_VERSION, getUrlHost } from '../../src/config/app-config';
import { useAuth } from '../../src/context/auth-context';
import { useBrand } from '../../src/features/branding/brand-context';
import { PoweredBy } from '../../src/features/branding/powered-by';
import type { MobileAppConfig } from '../../src/features/config/mobile-config';

interface InfoRowProps {
	icon: LucideIcon;
	label: string;
	value: string;
	caption?: string;
	isLast?: boolean;
}

function InfoRow({ icon: Icon, label, value, caption, isLast }: InfoRowProps) {
	const { tokens } = useBrand();
	return (
		<View
			className="flex-row items-start py-3"
			style={isLast ? undefined : { borderBottomWidth: 1, borderColor: '#F1F5F9' }}
		>
			<Icon size={18} color={tokens.primary} />
			<View className="ml-3 flex-1">
				<Text className="text-xs font-semibold uppercase tracking-wider text-slate-500">
					{label}
				</Text>
				<Text className="mt-0.5 text-sm font-bold text-slate-900">{value}</Text>
				{caption ? (
					<Text className="mt-0.5 text-xs text-slate-500">{caption}</Text>
				) : null}
			</View>
		</View>
	);
}

const describeMode = (
	config: MobileAppConfig,
): { value: string; caption: string } => {
	if (config.tenancyMode === null) {
		return {
			value: 'Sin datos',
			caption: 'No se pudo leer la configuración del servidor.',
		};
	}
	const value =
		config.tenancyMode === 'single' ? 'Una escuela' : 'Varias escuelas';
	return {
		value,
		caption:
			config.configStatus === 'fresh'
				? 'Configurado por el servidor'
				: 'Configurado por el servidor (última lectura guardada)',
	};
};

export default function SettingsScreen() {
	const { tokens, branding } = useBrand();
	const { user, config, logout } = useAuth();
	const router = useRouter();

	const handleLogout = async () => {
		await logout();
		router.replace('/(auth)/login');
	};

	const mode = describeMode(config);

	return (
		<SafeAreaView edges={['bottom']} className="flex-1 bg-slate-50">
			<ScrollView className="flex-1 px-5 py-4">
				{/* User Profile Card */}
				<View className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
					<View className="flex-row items-center space-x-3.5">
						<View className="h-12 w-12 items-center justify-center rounded-2xl bg-primary-100">
							<User size={24} color={tokens.primary} />
						</View>
						<View className="ml-3 flex-1">
							<Text className="text-base font-bold text-slate-900">
								{user?.firstName} {user?.lastName}
							</Text>
							<Text className="text-xs text-slate-500">{user?.email}</Text>
							<View className="mt-1 flex-row items-center">
								<View className="rounded bg-primary-50 px-2 py-0.5 border border-primary-200">
									<Text className="text-[11px] font-bold uppercase text-primary-700">
										Rol: {user?.role}
									</Text>
								</View>
							</View>
						</View>
					</View>
				</View>

				{/* Read-only deployment info */}
				<View className="mb-5 rounded-2xl border border-slate-200 bg-white px-5 py-2 shadow-sm">
					<InfoRow
						icon={School}
						label="Escuela"
						value={config.schoolName ?? 'Según tu cuenta'}
						caption={
							config.schoolName
								? undefined
								: 'Se elige al iniciar sesión si tenés más de una.'
						}
					/>
					<InfoRow
						icon={Server}
						label="Servidor"
						value={getUrlHost(config.apiUrl)}
					/>
					<InfoRow
						icon={Sliders}
						label="Modo"
						value={mode.value}
						caption={mode.caption}
					/>
					<InfoRow
						icon={Smartphone}
						label="Versión"
						value={`${APP_VERSION} (${config.variant})`}
						isLast
					/>
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

				{branding.showPoweredBy && (
					<View className="mb-6">
						<PoweredBy />
					</View>
				)}
			</ScrollView>
		</SafeAreaView>
	);
}
