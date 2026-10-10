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

export default function LoginScreen() {
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
		<SafeAreaView className="flex-1 bg-slate-50">
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
						<View className="mb-3 h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 shadow-md">
							<Text className="text-3xl font-extrabold text-white">V</Text>
						</View>
						<Text className="text-2xl font-bold tracking-tight text-slate-900">
							{config.appName}
						</Text>

						{config.tenancyMode === 'single' ? (
							<View className="mt-2 flex-row items-center rounded-full bg-indigo-50 px-3 py-1 border border-indigo-100">
								<School size={14} color="#4F46E5" />
								<Text className="ml-1.5 text-xs font-semibold text-indigo-700">
									{config.defaultTenantName || 'Instancia Institucional'}
								</Text>
							</View>
						) : (
							<Text className="mt-1 text-center text-sm text-slate-500">
								Gestión de asistencia escolar
							</Text>
						)}

						<View className="mt-2 rounded-lg bg-amber-50 px-2.5 py-1 border border-amber-200">
							<Text className="text-[11px] font-semibold text-amber-800">
								Exclusivo para Preceptores y Docentes
							</Text>
						</View>
					</View>

					{/* Form Card */}
					<View className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
						<Text className="mb-6 text-xl font-semibold text-slate-800">
							Iniciar Sesión
						</Text>

						{errorMessage && (
							<View className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3">
								<Text className="text-sm font-medium text-red-700">{errorMessage}</Text>
							</View>
						)}

						{/* Email input */}
						<View className="mb-4">
							<Text className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600">
								Correo Electrónico
							</Text>
							<View className="flex-row items-center rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-3 focus:border-indigo-600">
								<Mail size={18} color="#64748B" />
								<TextInput
									className="ml-2.5 flex-1 text-base text-slate-900"
									placeholder="tu.correo@escuela.edu.ar"
									placeholderTextColor="#94A3B8"
									autoCapitalize="none"
									keyboardType="email-address"
									value={email}
									onChangeText={setEmail}
								/>
							</View>
						</View>

						{/* Password input */}
						<View className="mb-6">
							<Text className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600">
								Contraseña
							</Text>
							<View className="flex-row items-center rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-3 focus:border-indigo-600">
								<Lock size={18} color="#64748B" />
								<TextInput
									className="ml-2.5 flex-1 text-base text-slate-900"
									placeholder="••••••••"
									placeholderTextColor="#94A3B8"
									secureTextEntry
									value={password}
									onChangeText={setPassword}
								/>
							</View>
						</View>

						{/* Submit button */}
						<TouchableOpacity
							className="items-center justify-center rounded-xl bg-indigo-600 py-3.5 shadow-sm active:bg-indigo-700 disabled:opacity-50"
							onPress={handleLogin}
							disabled={isSubmitting}
						>
							{isSubmitting ? (
								<ActivityIndicator size="small" color="#FFFFFF" />
							) : (
								<Text className="text-base font-semibold text-white">
									Ingresar al Sistema
								</Text>
							)}
						</TouchableOpacity>
					</View>

					{/* Tenancy Mode Badge */}
					<View className="mt-8 items-center">
						<Text className="text-xs text-slate-400">
							Modo:{' '}
							{config.tenancyMode === 'single'
								? 'Institución Única (Single-Tenant)'
								: 'Multi-Tenant (Múltiples Escuelas)'}
						</Text>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}
