import { useRouter } from 'expo-router';
import { Lock, Mail, School } from 'lucide-react-native';
import React, { useState } from 'react';
import {
	ActivityIndicator,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/auth-context';
import { useBrand } from '../../src/features/branding/brand-context';
import { BrandMark } from '../../src/features/branding/brand-mark';
import { PoweredBy } from '../../src/features/branding/powered-by';
import { useThemeColors } from '../../src/features/theme/use-theme-colors';

export default function LoginScreen() {
	const { branding } = useBrand();
	const theme = useThemeColors();
	const { login, config } = useAuth();
	const router = useRouter();

	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const handleLogin = async () => {
		if (!email.trim() || !password) {
			setErrorMessage('Por favor completá todos los campos.');
			return;
		}

		setErrorMessage(null);
		setIsSubmitting(true);

		try {
			const { requiresTenantSelection } = await login(
				email.trim().toLowerCase(),
				password,
			);

			if (requiresTenantSelection) {
				router.replace('/(auth)/select-tenant');
			} else {
				router.replace('/(app)');
			}
		} catch (error: unknown) {
			const err = error as {
				response?: { data?: { message?: string } };
				message?: string;
			};
			const msg =
				err?.response?.data?.message ||
				err?.message ||
				'Credenciales inválidas o error de conexión';
			setErrorMessage(typeof msg === 'string' ? msg : 'Error al iniciar sesión');
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<SafeAreaView className="flex-1 bg-background">
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				className="flex-1"
			>
				<ScrollView
					contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
					className="px-6 py-8"
					keyboardShouldPersistTaps="handled"
				>
					{/* Header & Logo */}
					<View className="mb-8 items-center">
						<View className="mb-3">
							<BrandMark size="lg" />
						</View>
						<Text className="text-2xl font-bold tracking-tight text-foreground">
							{config.appName}
						</Text>

						{config.schoolName ? (
							<View className="mt-2 flex-row items-center rounded-full bg-primary-50 dark:bg-primary-ink/15 px-3 py-1 border border-primary-100 dark:border-primary-ink/25">
								<School size={14} color={theme.primaryInk} />
								<Text className="ml-1.5 text-xs font-semibold text-primary-700 dark:text-primary-ink">
									{config.schoolName}
								</Text>
							</View>
						) : (
							<Text className="mt-1 text-center text-sm text-muted-foreground">
								Gestión de asistencia escolar
							</Text>
						)}

						<View className="mt-2 rounded-lg bg-amber-50 dark:bg-amber-500/15 px-2.5 py-1 border border-amber-200 dark:border-amber-500/40">
							<Text className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
								Exclusivo para Preceptores y Docentes
							</Text>
						</View>
					</View>

					{/* Form Card */}
					<View className="rounded-2xl border border-border bg-card p-6 shadow-sm">
						<Text className="mb-6 text-xl font-semibold text-neutral-800">
							Iniciar Sesión
						</Text>

						{errorMessage && (
							<View className="mb-4 rounded-xl border border-red-200 dark:border-red-500/40 bg-red-50 dark:bg-red-500/15 p-3">
								<Text className="text-sm font-medium text-red-700 dark:text-red-300">
									{errorMessage}
								</Text>
							</View>
						)}

						{/* Email input */}
						<View className="mb-4">
							<Text className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-600">
								Correo Electrónico
							</Text>
							<View className="flex-row items-center rounded-xl border border-neutral-300 bg-background px-3.5 py-3 focus:border-primary dark:focus:border-primary-ink">
								<Mail size={18} color={theme.mutedForeground} />
								<TextInput
									className="ml-2.5 flex-1 text-base text-foreground"
									placeholder="tu.correo@escuela.edu.ar"
									placeholderTextColor={theme.neutral400}
									autoCapitalize="none"
									keyboardType="email-address"
									value={email}
									onChangeText={setEmail}
								/>
							</View>
						</View>

						{/* Password input */}
						<View className="mb-6">
							<Text className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-600">
								Contraseña
							</Text>
							<View className="flex-row items-center rounded-xl border border-neutral-300 bg-background px-3.5 py-3 focus:border-primary dark:focus:border-primary-ink">
								<Lock size={18} color={theme.mutedForeground} />
								<TextInput
									className="ml-2.5 flex-1 text-base text-foreground"
									placeholder="••••••••"
									placeholderTextColor={theme.neutral400}
									secureTextEntry
									value={password}
									onChangeText={setPassword}
								/>
							</View>
						</View>

						{/* Submit button */}
						<TouchableOpacity
							className="items-center justify-center rounded-xl bg-primary py-3.5 shadow-sm active:bg-primary-700 disabled:opacity-50"
							onPress={handleLogin}
							disabled={isSubmitting}
						>
							{isSubmitting ? (
								<ActivityIndicator size="small" color="#FFFFFF" />
							) : (
								<Text className="text-base font-semibold text-primary-foreground">
									Ingresar al Sistema
								</Text>
							)}
						</TouchableOpacity>
					</View>

					{/* Server config status */}
					<View className="mt-8 items-center">
						<Text className="text-xs text-neutral-400">
							{config.tenancyMode === 'single' && 'Modo: Una escuela'}
							{config.tenancyMode === 'multi' && 'Modo: Varias escuelas'}
							{config.tenancyMode === null &&
								config.configStatus === 'unavailable' &&
								'No se pudo leer la configuración del servidor.'}
						</Text>
					</View>

					{branding.showPoweredBy && (
						<View className="mt-4">
							<PoweredBy />
						</View>
					)}
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}
