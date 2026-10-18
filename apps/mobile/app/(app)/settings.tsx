import { useRouter } from 'expo-router';
import {
	LogOut,
	type LucideIcon,
	Palette,
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
import { THEME_OPTIONS } from '../../src/features/theme/theme-preference';
import { useThemePreference } from '../../src/features/theme/theme-provider';
import { useThemeColors } from '../../src/features/theme/use-theme-colors';

interface InfoRowProps {
	icon: LucideIcon;
	label: string;
	value: string;
	caption?: string;
	isLast?: boolean;
}

function InfoRow({ icon: Icon, label, value, caption, isLast }: InfoRowProps) {
	const colors = useThemeColors();
	return (
		<View
			className="flex-row items-start py-3"
			style={
				isLast ? undefined : { borderBottomWidth: 1, borderColor: colors.muted }
			}
		>
			<Icon size={18} color={colors.primaryInk} />
			<View className="ml-3 flex-1">
				<Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
					{label}
				</Text>
				<Text className="mt-0.5 text-sm font-bold text-foreground">{value}</Text>
				{caption ? (
					<Text className="mt-0.5 text-xs text-muted-foreground">{caption}</Text>
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
	const { branding } = useBrand();
	const colors = useThemeColors();
	const { preference, setPreference } = useThemePreference();
	const { user, config, logout } = useAuth();
	const router = useRouter();

	const handleLogout = async () => {
		await logout();
		router.replace('/(auth)/login');
	};

	const mode = describeMode(config);

	return (
		<SafeAreaView edges={['bottom']} className="flex-1 bg-background">
			<ScrollView className="flex-1 px-5 py-4">
				{/* User Profile Card */}
				<View className="mb-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
					<View className="flex-row items-center space-x-3.5">
						<View className="h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 dark:bg-primary-ink/15">
							<User size={24} color={colors.primaryInk} />
						</View>
						<View className="ml-3 flex-1">
							<Text className="text-base font-bold text-foreground">
								{user?.firstName} {user?.lastName}
							</Text>
							<Text className="text-xs text-muted-foreground">{user?.email}</Text>
							<View className="mt-1 flex-row items-center">
								<View className="rounded bg-primary-50 px-2 py-0.5 border border-primary-200 dark:bg-primary-ink/15 dark:border-primary-ink/40">
									<Text className="text-[11px] font-bold uppercase text-primary-700 dark:text-primary-ink">
										Rol: {user?.role}
									</Text>
								</View>
							</View>
						</View>
					</View>
				</View>

				{/* Read-only deployment info */}
				<View className="mb-5 rounded-2xl border border-border bg-card px-5 py-2 shadow-sm">
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

				{/* Theme preference (stored on this device) */}
				<View className="mb-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
					<View className="flex-row items-center">
						<Palette size={18} color={colors.primaryInk} />
						<Text className="ml-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
							Tema
						</Text>
					</View>
					<View className="mt-3 flex-row rounded-xl border border-border bg-muted p-1">
						{THEME_OPTIONS.map((option) => {
							const isActive = preference === option.value;
							return (
								<TouchableOpacity
									key={option.value}
									onPress={() => setPreference(option.value)}
									accessibilityRole="button"
									accessibilityState={{ selected: isActive }}
									className="flex-1 items-center rounded-lg py-2"
									style={isActive ? { backgroundColor: colors.primary } : undefined}
								>
									<Text
										className="text-sm font-bold"
										style={{ color: isActive ? colors.onPrimary : colors.neutral600 }}
									>
										{option.label}
									</Text>
								</TouchableOpacity>
							);
						})}
					</View>
				</View>

				{/* Role Policy Notice */}
				<View
					className="mb-6 rounded-2xl border p-4"
					style={{
						backgroundColor: colors.status.warning.background,
						borderColor: colors.status.warning.border,
					}}
				>
					<View className="flex-row items-start space-x-2.5">
						<ShieldAlert size={18} color={colors.status.warning.icon} />
						<View className="ml-2 flex-1">
							<Text className="text-xs font-bold text-amber-900 dark:text-amber-200">
								Política de Seguridad de Roles
							</Text>
							<Text className="mt-0.5 text-xs text-amber-800 dark:text-amber-300">
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
					className="mb-8 flex-row items-center justify-center rounded-xl border border-red-200 bg-card py-3.5 active:bg-red-50 dark:border-red-900 dark:active:bg-red-950"
				>
					<LogOut size={18} color={colors.destructive} />
					<Text className="ml-2 text-sm font-bold text-red-600 dark:text-red-400">
						Cerrar Sesión
					</Text>
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
