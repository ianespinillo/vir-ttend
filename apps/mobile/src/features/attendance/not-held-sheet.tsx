import { AlertCircle } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
	ActivityIndicator,
	KeyboardAvoidingView,
	Modal,
	Platform,
	Pressable,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import { useThemeColors } from '../theme/use-theme-colors';
import {
	MAX_NOT_HELD_REASON_LENGTH,
	NOT_HELD_COPY,
	type NotHeldKind,
	formatNotHeldWarning,
	normalizeNotHeldReason,
} from './not-held';

// NativeWind: className stays static, tones go through inline style.

interface Props {
	visible: boolean;
	kind: NotHeldKind;
	/** Attendance already saved for the day; it is deleted when marking. */
	savedRecordsCount: number;
	isSubmitting: boolean;
	errorMessage: string | null;
	onCancel: () => void;
	onConfirm: (reason?: string) => void;
}

/** Confirmation sheet to mark a class or workshop as not held. */
export function NotHeldSheet({
	visible,
	kind,
	savedRecordsCount,
	isSubmitting,
	errorMessage,
	onCancel,
	onConfirm,
}: Props) {
	const [reason, setReason] = useState('');
	const theme = useThemeColors();
	const copy = NOT_HELD_COPY[kind];

	// Every opening starts from a clean form.
	useEffect(() => {
		if (visible) setReason('');
	}, [visible]);

	return (
		<Modal
			visible={visible}
			transparent
			animationType="slide"
			onRequestClose={() => {
				if (!isSubmitting) onCancel();
			}}
		>
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
				className="flex-1"
			>
				<Pressable
					className="flex-1"
					style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)' }}
					onPress={() => {
						if (!isSubmitting) onCancel();
					}}
				/>
				<View className="rounded-t-3xl bg-card px-5 pb-6 pt-5">
					<Text className="text-lg font-bold text-foreground">{copy.title}</Text>
					<View
						className="mt-3 rounded-xl border p-3"
						style={{
							backgroundColor: theme.status.warning.background,
							borderColor: theme.status.warning.border,
						}}
					>
						<Text
							className="text-xs"
							style={{ color: theme.status.warning.strongText }}
						>
							{formatNotHeldWarning(savedRecordsCount)}
						</Text>
					</View>

					<Text className="mb-2 mt-4 text-xs font-bold uppercase text-muted-foreground">
						Motivo (opcional)
					</Text>
					<TextInput
						value={reason}
						onChangeText={setReason}
						editable={!isSubmitting}
						maxLength={MAX_NOT_HELD_REASON_LENGTH}
						multiline
						placeholder="Ej: docente ausente"
						placeholderTextColor={theme.neutral400}
						className="rounded-xl border border-neutral-300 bg-card px-3 py-2.5 text-sm text-foreground"
						style={{ minHeight: 72, textAlignVertical: 'top' }}
					/>

					{errorMessage ? (
						<View className="mt-3 flex-row items-start rounded-xl border border-red-200 dark:border-red-500/40 bg-red-50 dark:bg-red-500/15 p-3">
							<AlertCircle size={15} color={theme.status.danger.icon} />
							<Text className="ml-2 flex-1 text-xs text-red-700 dark:text-red-300">
								{errorMessage}
							</Text>
						</View>
					) : null}

					<View className="mt-4 flex-row">
						<TouchableOpacity
							onPress={onCancel}
							disabled={isSubmitting}
							className="mr-2 flex-1 items-center rounded-xl border border-neutral-300 py-3"
						>
							<Text className="text-sm font-bold text-neutral-700">Cancelar</Text>
						</TouchableOpacity>
						<TouchableOpacity
							onPress={() => onConfirm(normalizeNotHeldReason(reason))}
							disabled={isSubmitting}
							className="ml-2 flex-1 items-center rounded-xl bg-primary py-3"
							style={{ opacity: isSubmitting ? 0.5 : 1 }}
						>
							{isSubmitting ? (
								<ActivityIndicator size="small" color="#FFFFFF" />
							) : (
								<Text className="text-sm font-bold text-white">Confirmar</Text>
							)}
						</TouchableOpacity>
					</View>
				</View>
			</KeyboardAvoidingView>
		</Modal>
	);
}
