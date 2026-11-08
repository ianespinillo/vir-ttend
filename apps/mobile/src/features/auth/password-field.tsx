import { Eye, EyeOff } from 'lucide-react-native';
import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useThemeColors } from '../theme/use-theme-colors';

interface PasswordFieldProps {
	label: string;
	placeholder: string;
	value: string;
	onChangeText: (text: string) => void;
	error?: string;
	editable?: boolean;
}

/** Labelled password input with a show/hide toggle and inline error. */
export function PasswordField({
	label,
	placeholder,
	value,
	onChangeText,
	error,
	editable = true,
}: PasswordFieldProps) {
	const theme = useThemeColors();
	const [visible, setVisible] = useState(false);

	return (
		<View className="mb-4">
			<Text className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-600">
				{label}
			</Text>
			<View className="flex-row items-center rounded-xl border border-neutral-300 bg-background px-3.5 py-3 focus:border-primary dark:focus:border-primary-ink">
				<TextInput
					className="flex-1 text-base text-foreground"
					placeholder={placeholder}
					placeholderTextColor={theme.neutral400}
					secureTextEntry={!visible}
					autoCapitalize="none"
					autoCorrect={false}
					editable={editable}
					value={value}
					onChangeText={onChangeText}
				/>
				<TouchableOpacity
					onPress={() => setVisible((prev) => !prev)}
					accessibilityLabel={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
					hitSlop={8}
				>
					{visible ? (
						<EyeOff size={18} color={theme.mutedForeground} />
					) : (
						<Eye size={18} color={theme.mutedForeground} />
					)}
				</TouchableOpacity>
			</View>
			{error && (
				<Text className="mt-1 text-xs font-medium text-red-700 dark:text-red-300">
					{error}
				</Text>
			)}
		</View>
	);
}
