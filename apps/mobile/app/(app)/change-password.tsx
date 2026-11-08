import { useRouter } from 'expo-router';
import { CheckCircle2 } from 'lucide-react-native';
import React, { useState } from 'react';
import {
	ActivityIndicator,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
	CHANGE_PASSWORD_OFFLINE_NOTICE,
	type ChangePasswordField,
	type ChangePasswordFieldErrors,
	changePassword,
	getChangePasswordErrorMessage,
	validateChangePassword,
} from '../../src/features/auth/change-password';
import { PasswordField } from '../../src/features/auth/password-field';
import { useIsOnline } from '../../src/features/offline/use-is-online';

const FIELDS: ReadonlyArray<{
	name: ChangePasswordField;
	label: string;
	placeholder: string;
}> = [
	{
		name: 'oldPassword',
		label: 'Contraseña actual',
		placeholder: 'Ingresá tu contraseña actual',
	},
	{
		name: 'newPassword',
		label: 'Nueva contraseña',
		placeholder: 'Mínimo 8 caracteres',
	},
	{
		name: 'confirmNewPassword',
		label: 'Confirmar contraseña',
		placeholder: 'Repetí la nueva contraseña',
	},
];

const EMPTY_VALUES = {
	oldPassword: '',
	newPassword: '',
	confirmNewPassword: '',
};

/** Voluntary password change, reachable from Settings. */
export default function ChangePasswordScreen() {
	const router = useRouter();
	const online = useIsOnline();

	const [values, setValues] = useState(EMPTY_VALUES);
	const [fieldErrors, setFieldErrors] = useState<ChangePasswordFieldErrors>({});
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [succeeded, setSucceeded] = useState(false);

	const handleSubmit = async () => {
		const errors = validateChangePassword(values);
		setFieldErrors(errors);
		if (Object.keys(errors).length > 0) return;

		setErrorMessage(null);
		setIsSubmitting(true);
		try {
			await changePassword(values);
			setValues(EMPTY_VALUES);
			setSucceeded(true);
		} catch (error: unknown) {
			setErrorMessage(getChangePasswordErrorMessage(error));
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<SafeAreaView edges={['bottom']} className="flex-1 bg-background">
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				className="flex-1"
			>
				<ScrollView
					className="flex-1 px-5 py-4"
					keyboardShouldPersistTaps="handled"
				>
					<View className="rounded-2xl border border-border bg-card p-5 shadow-sm">
						{succeeded ? (
							<View className="items-center py-4">
								<CheckCircle2 size={40} color="#16a34a" />
								<Text className="mt-3 text-lg font-bold text-foreground">
									Contraseña actualizada
								</Text>
								<Text className="mt-1 text-center text-sm text-muted-foreground">
									Tu contraseña se cambió correctamente.
								</Text>
								<TouchableOpacity
									className="mt-5 items-center justify-center self-stretch rounded-xl bg-primary py-3.5 active:bg-primary-700"
									onPress={() => router.back()}
								>
									<Text className="text-base font-semibold text-primary-foreground">
										Volver
									</Text>
								</TouchableOpacity>
							</View>
						) : (
							<>
								<Text className="mb-4 text-sm text-muted-foreground">
									Ingresá tu contraseña actual y elegí una nueva de al menos 8
									caracteres.
								</Text>

								{!online && (
									<View className="mb-4 rounded-xl border border-amber-200 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/15 p-3">
										<Text className="text-sm font-medium text-amber-800 dark:text-amber-300">
											{CHANGE_PASSWORD_OFFLINE_NOTICE}
										</Text>
									</View>
								)}

								{errorMessage && (
									<View className="mb-4 rounded-xl border border-red-200 dark:border-red-500/40 bg-red-50 dark:bg-red-500/15 p-3">
										<Text className="text-sm font-medium text-red-700 dark:text-red-300">
											{errorMessage}
										</Text>
									</View>
								)}

								{FIELDS.map(({ name, label, placeholder }) => (
									<PasswordField
										key={name}
										label={label}
										placeholder={placeholder}
										value={values[name]}
										error={fieldErrors[name]}
										editable={!isSubmitting}
										onChangeText={(text) =>
											setValues((prev) => ({ ...prev, [name]: text }))
										}
									/>
								))}

								<TouchableOpacity
									className="items-center justify-center rounded-xl bg-primary py-3.5 shadow-sm active:bg-primary-700 disabled:opacity-50"
									onPress={handleSubmit}
									disabled={isSubmitting || !online}
								>
									{isSubmitting ? (
										<View className="flex-row items-center">
											<ActivityIndicator size="small" color="#FFFFFF" />
											<Text className="ml-2 text-base font-semibold text-primary-foreground">
												Actualizando...
											</Text>
										</View>
									) : (
										<Text className="text-base font-semibold text-primary-foreground">
											Cambiar contraseña
										</Text>
									)}
								</TouchableOpacity>
							</>
						)}
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}
