import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle2, KeyRound, Mail } from 'lucide-react-native';
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
import {
	type ResetPasswordFieldErrors,
	confirmPasswordReset,
	getForgotPasswordErrorMessage,
	requestPasswordReset,
	validateForgotPassword,
	validateResetPassword,
} from '../../src/features/auth/forgot-password';
import { PasswordField } from '../../src/features/auth/password-field';
import { BrandMark } from '../../src/features/branding/brand-mark';
import { useThemeColors } from '../../src/features/theme/use-theme-colors';

type Step = 'request' | 'reset' | 'done';

/** Self-service password recovery: email a 6-digit code, then set a new password. */
export default function ForgotPasswordScreen() {
	const router = useRouter();
	const theme = useThemeColors();
	const params = useLocalSearchParams<{ email?: string }>();

	const [step, setStep] = useState<Step>('request');
	const [email, setEmail] = useState(
		typeof params.email === 'string' ? params.email : '',
	);
	const [emailError, setEmailError] = useState<string | null>(null);
	const [code, setCode] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmNewPassword, setConfirmNewPassword] = useState('');
	const [fieldErrors, setFieldErrors] = useState<ResetPasswordFieldErrors>({});
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [notice, setNotice] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isResending, setIsResending] = useState(false);

	const goToLogin = () => router.replace('/(auth)/login');

	const handleRequest = async () => {
		const error = validateForgotPassword({ email });
		setEmailError(error);
		if (error) return;

		setErrorMessage(null);
		setIsSubmitting(true);
		try {
			await requestPasswordReset(email);
			setNotice(null);
			setStep('reset');
		} catch (err) {
			setErrorMessage(getForgotPasswordErrorMessage(err));
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleResend = async () => {
		setErrorMessage(null);
		setNotice(null);
		setIsResending(true);
		try {
			await requestPasswordReset(email);
			setNotice('Si pasó más de un minuto, te enviamos un código nuevo.');
		} catch (err) {
			setErrorMessage(getForgotPasswordErrorMessage(err));
		} finally {
			setIsResending(false);
		}
	};

	const handleReset = async () => {
		const values = { email, code, newPassword, confirmNewPassword };
		const errors = validateResetPassword(values);
		setFieldErrors(errors);
		if (Object.keys(errors).length > 0) return;

		setErrorMessage(null);
		setIsSubmitting(true);
		try {
			await confirmPasswordReset(values);
			setStep('done');
		} catch (err) {
			setErrorMessage(getForgotPasswordErrorMessage(err));
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
					<View className="mb-6 items-center">
						<BrandMark size="lg" />
					</View>

					<View className="rounded-2xl border border-border bg-card p-6 shadow-sm">
						{step === 'done' ? (
							<View className="items-center py-2">
								<CheckCircle2 size={40} color="#16a34a" />
								<Text className="mt-3 text-lg font-bold text-foreground">
									Contraseña actualizada
								</Text>
								<Text className="mt-1 text-center text-sm text-muted-foreground">
									Ya podés iniciar sesión con tu nueva contraseña. Cerramos las sesiones
									que tenías abiertas en otros dispositivos.
								</Text>
								<TouchableOpacity
									className="mt-5 items-center justify-center self-stretch rounded-xl bg-primary py-3.5 active:bg-primary-700"
									onPress={goToLogin}
								>
									<Text className="text-base font-semibold text-primary-foreground">
										Ir a iniciar sesión
									</Text>
								</TouchableOpacity>
							</View>
						) : (
							<>
								<Text className="mb-2 text-xl font-semibold text-neutral-800">
									{step === 'request' ? 'Recuperar contraseña' : 'Ingresá el código'}
								</Text>
								<Text className="mb-5 text-sm text-muted-foreground">
									{step === 'request'
										? 'Te enviaremos un código de 6 dígitos a tu correo para que definas una contraseña nueva.'
										: `Si ${email.trim()} tiene una cuenta, le enviamos un código. Vence en 15 minutos.`}
								</Text>

								{errorMessage && (
									<View className="mb-4 rounded-xl border border-red-200 dark:border-red-500/40 bg-red-50 dark:bg-red-500/15 p-3">
										<Text className="text-sm font-medium text-red-700 dark:text-red-300">
											{errorMessage}
										</Text>
									</View>
								)}
								{notice && (
									<View className="mb-4 rounded-xl border border-emerald-200 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/15 p-3">
										<Text className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
											{notice}
										</Text>
									</View>
								)}

								{step === 'request' ? (
									<React.Fragment key="request">
										<View className="mb-6">
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
													autoComplete="email"
													keyboardType="email-address"
													editable={!isSubmitting}
													value={email}
													onChangeText={setEmail}
													onSubmitEditing={handleRequest}
												/>
											</View>
											{emailError && (
												<Text className="mt-1 text-xs text-red-600 dark:text-red-400">
													{emailError}
												</Text>
											)}
										</View>

										<TouchableOpacity
											className="flex-row items-center justify-center rounded-xl bg-primary py-3.5 shadow-sm active:bg-primary-700 disabled:opacity-50"
											onPress={handleRequest}
											disabled={isSubmitting}
										>
											{isSubmitting ? (
												<ActivityIndicator size="small" color="#FFFFFF" />
											) : (
												<Text className="text-base font-semibold text-primary-foreground">
													Enviar código
												</Text>
											)}
										</TouchableOpacity>
									</React.Fragment>
								) : (
									<React.Fragment key="reset">
										<View className="mb-4">
											<Text className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-600">
												Código
											</Text>
											<View className="flex-row items-center rounded-xl border border-neutral-300 bg-background px-3.5 py-3 focus:border-primary dark:focus:border-primary-ink">
												<KeyRound size={18} color={theme.mutedForeground} />
												<TextInput
													className="ml-2.5 flex-1 text-lg tracking-[6px] text-foreground"
													placeholder="000000"
													placeholderTextColor={theme.neutral400}
													keyboardType="number-pad"
													autoComplete="one-time-code"
													textContentType="oneTimeCode"
													maxLength={6}
													editable={!isSubmitting}
													value={code}
													onChangeText={(text) => setCode(text.replace(/\D/g, ''))}
												/>
											</View>
											{fieldErrors.code && (
												<Text className="mt-1 text-xs text-red-600 dark:text-red-400">
													{fieldErrors.code}
												</Text>
											)}
										</View>

										<PasswordField
											label="Nueva contraseña"
											placeholder="Mínimo 8 caracteres"
											value={newPassword}
											error={fieldErrors.newPassword}
											editable={!isSubmitting}
											onChangeText={setNewPassword}
										/>
										<PasswordField
											label="Confirmar contraseña"
											placeholder="Repetí la nueva contraseña"
											value={confirmNewPassword}
											error={fieldErrors.confirmNewPassword}
											editable={!isSubmitting}
											onChangeText={setConfirmNewPassword}
										/>

										<Text className="mb-4 text-xs text-muted-foreground">
											Usá al menos 8 caracteres con una mayúscula, una minúscula, un número
											y un carácter especial (@$!%*?&).
										</Text>

										<TouchableOpacity
											className="items-center justify-center rounded-xl bg-primary py-3.5 shadow-sm active:bg-primary-700 disabled:opacity-50"
											onPress={handleReset}
											disabled={isSubmitting}
										>
											{isSubmitting ? (
												<ActivityIndicator size="small" color="#FFFFFF" />
											) : (
												<Text className="text-base font-semibold text-primary-foreground">
													Cambiar contraseña
												</Text>
											)}
										</TouchableOpacity>

										<View className="mt-4 flex-row items-center justify-between">
											<TouchableOpacity
												onPress={() => {
													setErrorMessage(null);
													setNotice(null);
													setFieldErrors({});
													setStep('request');
												}}
											>
												<Text className="text-sm text-muted-foreground">
													Usar otro correo
												</Text>
											</TouchableOpacity>
											<TouchableOpacity onPress={handleResend} disabled={isResending}>
												<Text className="text-sm font-semibold text-primary dark:text-primary-ink">
													{isResending ? 'Reenviando…' : 'Reenviar código'}
												</Text>
											</TouchableOpacity>
										</View>
									</React.Fragment>
								)}
							</>
						)}
					</View>

					{step !== 'done' && (
						<TouchableOpacity
							className="mt-6 flex-row items-center justify-center"
							onPress={goToLogin}
						>
							<ArrowLeft size={16} color={theme.mutedForeground} />
							<Text className="ml-1.5 text-sm text-muted-foreground">
								Volver a iniciar sesión
							</Text>
						</TouchableOpacity>
					)}
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}
