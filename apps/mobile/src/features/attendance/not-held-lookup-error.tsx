import { AlertCircle } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useThemeColors } from '../theme/use-theme-colors';
import { NOT_HELD_COPY, type NotHeldKind } from './not-held';

interface Props {
	kind: NotHeldKind;
	onRetry: () => void;
}

/** Shown (online) when it could not be verified whether the day was held. */
export function NotHeldLookupError({ kind, onRetry }: Props) {
	const theme = useThemeColors();
	return (
		<View
			className="mx-5 mt-4 flex-row items-center rounded-xl border p-3"
			style={{
				backgroundColor: theme.status.danger.background,
				borderColor: theme.status.danger.border,
			}}
		>
			<AlertCircle size={15} color={theme.status.danger.icon} />
			<Text
				className="ml-2 flex-1 text-xs font-bold"
				style={{ color: theme.status.danger.strongText }}
			>
				{NOT_HELD_COPY[kind].lookupError}
			</Text>
			<TouchableOpacity
				onPress={onRetry}
				className="ml-2 rounded-lg border border-primary-200 dark:border-primary-ink/40 bg-primary-50 dark:bg-primary-ink/15 px-3 py-1.5"
			>
				<Text className="text-xs font-bold text-primary-700 dark:text-primary-ink">
					Reintentar
				</Text>
			</TouchableOpacity>
		</View>
	);
}
