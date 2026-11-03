import {
	Eye,
	EyeOff,
	KeyRound,
	LogOut,
	ShieldAlert,
} from 'lucide-react-native';
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
import { useAuth } from '../../context/auth-context';
import { useIsOnline } from '../offline/use-is-online';
import { useThemeColors } from '../theme/use-theme-colors';
import {
	CHANGE_PASSWORD_OFFLINE_NOTICE,
	type ChangePasswordField,
	type ChangePasswordFieldErrors,
	changePassword,
	getChangePasswordErrorMessage,
	validateChangePassword,
} from './change-password';

const FIELDS: ReadonlyArray<{
	name: ChangePasswordField;
	label: string;
	placeholder: string;
}> = [
	{
		name: 'oldPassword',
		label: 'Contraseña temporal recibida',
		placeholder: 'Ingresá la contraseña del correo',
	},
	{
		name: 'newPassword',
		label: 'Nueva contraseña',
		placeholder: 'Mínimo 8 caracteres',
	},
	{
		name: 'confirmNewPassword',
		label: 'Confirmar nueva contraseña',
		placeholder: 'Repetí la nueva contraseña',
	},
];

/**
 * Blocking screen shown instead of the app while the account still has a
 * temporary password. Mirrors the web `ForceChangePasswordDialog`.
 */
export function ForceChangePasswordScreen() {
	const theme = useThemeColors();
	const online = useIsOnline();
	const { logout, markPasswordChanged } = useAuth();

	const [values, setValues] = useState({
		oldPassword: '',
		newPassword: '',
		confirmNewPassword: '',
	});
	const [visible, setVisible] = useState<
		Partial<Record<ChangePasswordField, boolean>>
	>({});
	const [fieldErrors, setFieldErrors] = useState<ChangePasswordFieldErrors>({});
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async () => {
		const errors = validateChangePassword(values);
		setFieldErrors(errors);
		if (Object.keys(errors).length > 0) return;

		setErrorMessage(null);
		setIsSubmitting(true);
		try {
			await changePassword(values);
			await markPasswordChanged();
		} catch (error: unknown) {
			setErrorMessage(getChangePasswordErrorMessage(error));
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
					<View className="rounded-2xl border border-border bg-card p-6 shadow-sm">
						<View className="mb-3 h-12 w-12 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-500/15">
							<KeyRound size={24} color={theme.primaryInk} />
						</View>
						<Text className="text-xl font-bold text-foreground">
							Actualizá tu contraseña
						</Text>
						<Text className="mt-2 text-sm text-muted-foreground">
							Es tu primer ingreso al sistema o tu contraseña fue restablecida. Por
							motivos de seguridad, tenés que definir una nueva contraseña para
							continuar.
						</Text>

						<View className="mt-4 flex-row items-start rounded-xl border border-amber-200 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/15 p-3">
							<ShieldAlert size={16} color={theme.mutedForeground} />
							<Text className="ml-2 flex-1 text-xs text-amber-800 dark:text-amber-300">
								Ingresá la contraseña temporal que te enviamos por correo electrónico y
								definí tu nueva clave personal (mínimo 8 caracteres).
							</Text>
						</View>

						{!online && (
							<View className="mt-4 rounded-xl border border-amber-200 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/15 p-3">
								<Text className="text-sm font-medium text-amber-800 dark:text-amber-300">
									{CHANGE_PASSWORD_OFFLINE_NOTICE}
								</Text>
							</View>
						)}

						{errorMessage && (
							<View className="mt-4 rounded-xl border border-red-200 dark:border-red-500/40 bg-red-50 dark:bg-red-500/15 p-3">
								<Text className="text-sm font-medium text-red-700 dark:text-red-300">
									{errorMessage}
								</Text>
							</View>
						)}

						<View className="mt-4">
							{FIELDS.map(({ name, label, placeholder }) => (
								<View key={name} className="mb-4">
									<Text className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-600">
										{label}
									</Text>
									<View className="flex-row items-center rounded-xl border border-neutral-300 bg-background px-3.5 py-3 focus:border-primary dark:focus:border-primary-ink">
										<TextInput
											className="flex-1 text-base text-foreground"
											placeholder={placeholder}
											placeholderTextColor={theme.neutral400}
											secureTextEntry={!visible[name]}
											autoCapitalize="none"
											autoCorrect={false}
											editable={!isSubmitting}
											value={values[name]}
											onChangeText={(text) =>
												setValues((prev) => ({ ...prev, [name]: text }))
											}
										/>
										<TouchableOpacity
											onPress={() =>
												setVisible((prev) => ({ ...prev, [name]: !prev[name] }))
											}
											accessibilityLabel={
												visible[name] ? 'Ocultar contraseña' : 'Mostrar contraseña'
											}
											hitSlop={8}
										>
											{visible[name] ? (
												<EyeOff size={18} color={theme.mutedForeground} />
											) : (
												<Eye size={18} color={theme.mutedForeground} />
											)}
										</TouchableOpacity>
									</View>
									{fieldErrors[name] && (
										<Text className="mt-1 text-xs font-medium text-red-700 dark:text-red-300">
											{fieldErrors[name]}
										</Text>
									)}
								</View>
							))}
						</View>

						<TouchableOpacity
							className="items-center justify-center rounded-xl bg-primary py-3.5 shadow-sm active:bg-primary-700 disabled:opacity-50"
							onPress={handleSubmit}
							disabled={isSubmitting || !online}
						>
							{isSubmitting ? (
								<View className="flex-row items-center">
									<ActivityIndicator size="small" color="#FFFFFF" />
									<Text className="ml-2 text-base font-semibold text-primary-foreground">
										Actualizando contraseña...
									</Text>
								</View>
							) : (
								<Text className="text-base font-semibold text-primary-foreground">
									Guardar y continuar
								</Text>
							)}
						</TouchableOpacity>

						<TouchableOpacity
							className="mt-3 flex-row items-center justify-center py-2 disabled:opacity-50"
							onPress={() => void logout()}
							disabled={isSubmitting}
						>
							<LogOut size={16} color={theme.mutedForeground} />
							<Text className="ml-2 text-sm font-medium text-muted-foreground">
								Cerrar sesión
							</Text>
						</TouchableOpacity>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}
