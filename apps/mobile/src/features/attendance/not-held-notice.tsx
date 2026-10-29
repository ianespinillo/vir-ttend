import { CalendarOff } from 'lucide-react-native';
import React from 'react';
import {
	ActivityIndicator,
	Alert,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import { useThemeColors } from '../theme/use-theme-colors';
import { NOT_HELD_COPY, type NotHeldKind } from './not-held';

interface Props {
	kind: NotHeldKind;
	reason?: string;
	/** Present only when the user may unmark (online). */
	onUnmark?: () => void;
	isUnmarking?: boolean;
	errorMessage?: string | null;
}

/** Replaces the student list on a day marked as not held. */
export function NotHeldNotice({
	kind,
	reason,
	onUnmark,
	isUnmarking,
	errorMessage,
}: Props) {
	const theme = useThemeColors();
	const copy = NOT_HELD_COPY[kind];

	const confirmUnmark = () => {
		if (!onUnmark) return;
		Alert.alert(copy.unmarkTitle, copy.unmarkMessage, [
			{ text: 'Cancelar', style: 'cancel' },
			{ text: 'Habilitar', onPress: onUnmark },
		]);
	};

	return (
		<View className="flex-1 items-center justify-center px-6">
			<CalendarOff size={36} color={theme.status.warning.icon} />
			<Text className="mt-2 text-base font-semibold text-neutral-700">
				{copy.title}
			</Text>
			<Text className="mt-2 text-center text-sm text-muted-foreground">
				{copy.noticeDescription}
			</Text>
			{reason ? (
				<Text className="mt-2 text-center text-sm text-neutral-700">
					Motivo: {reason}
				</Text>
			) : null}
			{errorMessage ? (
				<Text className="mt-2 text-center text-xs text-red-700 dark:text-red-300">
					{errorMessage}
				</Text>
			) : null}
			{onUnmark ? (
				<TouchableOpacity
					onPress={confirmUnmark}
					disabled={isUnmarking}
					className="mt-4 rounded-xl border border-primary-200 dark:border-primary-ink/40 bg-primary-50 dark:bg-primary-ink/15 px-4 py-2 active:bg-primary-100 dark:active:bg-primary-ink/25"
					style={{ opacity: isUnmarking ? 0.5 : 1 }}
				>
					{isUnmarking ? (
						<ActivityIndicator size="small" color={theme.primaryInk} />
					) : (
						<Text className="text-xs font-bold text-primary-700 dark:text-primary-ink">
							{copy.unmark}
						</Text>
					)}
				</TouchableOpacity>
			) : null}
		</View>
	);
}
