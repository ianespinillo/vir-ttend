import { AlertCircle } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
	ActivityIndicator,
	KeyboardAvoidingView,
	Modal,
	Platform,
	Pressable,
	ScrollView,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import {
	JUSTIFICATION_PRESET_REASONS,
	type JustifyPayload,
	MAX_NOTES_LENGTH,
	MAX_REASON_LENGTH,
	OTHER_REASON,
	buildJustifyPayload,
} from './justification';

// NativeWind: className stays static, selected state goes through inline style.
const CHIP_IDLE = { background: '#FFFFFF', border: '#CBD5E1', text: '#334155' };
const CHIP_ACTIVE = {
	background: '#EEF2FF',
	border: '#6366F1',
	text: '#4338CA',
};

interface Props {
	visible: boolean;
	studentName?: string;
	isSubmitting: boolean;
	errorMessage: string | null;
	onCancel: () => void;
	onConfirm: (payload: JustifyPayload) => void;
}

/**
 * Bottom sheet to justify one absence: preset reasons (same as the web),
 * free text for "Otro" and optional notes.
 */
export function JustifySheet({
	visible,
	studentName,
	isSubmitting,
	errorMessage,
	onCancel,
	onConfirm,
}: Props) {
	const [preset, setPreset] = useState<string | null>(null);
	const [customReason, setCustomReason] = useState('');
	const [notes, setNotes] = useState('');

	// Every opening starts from a clean form.
	useEffect(() => {
		if (visible) {
			setPreset(null);
			setCustomReason('');
			setNotes('');
		}
	}, [visible]);

	const payload = buildJustifyPayload({ preset, customReason, notes });
	const canConfirm = payload !== null && !isSubmitting;

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
				<View
					className="rounded-t-3xl bg-white px-5 pb-6 pt-5"
					style={{ maxHeight: '85%' }}
				>
					<Text className="text-lg font-bold text-slate-900">
						Justificar inasistencia
					</Text>
					{studentName ? (
						<Text className="mt-0.5 text-sm text-slate-500">{studentName}</Text>
					) : null}

					<ScrollView
						className="mt-4"
						keyboardShouldPersistTaps="handled"
						showsVerticalScrollIndicator={false}
					>
						<Text className="mb-2 text-xs font-bold uppercase text-slate-500">
							Motivo
						</Text>
						<View className="flex-row flex-wrap">
							{JUSTIFICATION_PRESET_REASONS.map((reason) => {
								const colors = preset === reason ? CHIP_ACTIVE : CHIP_IDLE;
								return (
									<TouchableOpacity
										key={reason}
										disabled={isSubmitting}
										onPress={() => setPreset(reason)}
										className="mb-2 mr-2 rounded-full border px-3 py-2"
										style={{
											backgroundColor: colors.background,
											borderColor: colors.border,
										}}
									>
										<Text
											className="text-xs font-semibold"
											style={{ color: colors.text }}
										>
											{reason}
										</Text>
									</TouchableOpacity>
								);
							})}
						</View>

						{preset === OTHER_REASON ? (
							<TextInput
								value={customReason}
								onChangeText={setCustomReason}
								editable={!isSubmitting}
								maxLength={MAX_REASON_LENGTH}
								placeholder="Describí el motivo"
								placeholderTextColor="#94A3B8"
								className="mt-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
							/>
						) : null}

						<Text className="mb-2 mt-4 text-xs font-bold uppercase text-slate-500">
							Notas (opcional)
						</Text>
						<TextInput
							value={notes}
							onChangeText={setNotes}
							editable={!isSubmitting}
							maxLength={MAX_NOTES_LENGTH}
							multiline
							placeholder="Información adicional"
							placeholderTextColor="#94A3B8"
							className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
							style={{ minHeight: 72, textAlignVertical: 'top' }}
						/>

						{errorMessage ? (
							<View className="mt-3 flex-row items-start rounded-xl border border-red-200 bg-red-50 p-3">
								<AlertCircle size={15} color="#DC2626" />
								<Text className="ml-2 flex-1 text-xs text-red-700">{errorMessage}</Text>
							</View>
						) : null}
					</ScrollView>

					<View className="mt-4 flex-row">
						<TouchableOpacity
							onPress={onCancel}
							disabled={isSubmitting}
							className="mr-2 flex-1 items-center rounded-xl border border-slate-300 py-3"
						>
							<Text className="text-sm font-bold text-slate-700">Cancelar</Text>
						</TouchableOpacity>
						<TouchableOpacity
							onPress={() => payload && onConfirm(payload)}
							disabled={!canConfirm}
							className="ml-2 flex-1 items-center rounded-xl bg-primary py-3"
							style={{ opacity: canConfirm ? 1 : 0.5 }}
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
