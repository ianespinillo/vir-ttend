import { FileText } from 'lucide-react-native';
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useThemeColors } from '../theme/use-theme-colors';
import type { AttendanceJustification } from './types';

interface Props {
	/** Absent when the read does not embed it (e.g. subject attendance). */
	justification?: AttendanceJustification;
}

/**
 * "Justificado" badge with the reason; tap it to expand the notes (only
 * tappable when there are notes to show).
 */
export function JustificationBadge({ justification }: Props) {
	const [expanded, setExpanded] = useState(false);
	const notes = justification?.notes;
	// NativeWind: className stays static, the tone is applied through inline style.
	const TONE = useThemeColors().status.justified;

	return (
		<TouchableOpacity
			disabled={!notes}
			onPress={() => setExpanded((value) => !value)}
			className="mt-1.5 self-start rounded-md border px-2 py-1"
			style={{ backgroundColor: TONE.background, borderColor: TONE.border }}
		>
			<View className="flex-row items-center">
				<FileText size={11} color={TONE.text} />
				<Text
					className="ml-1 text-[11px] font-semibold"
					style={{ color: TONE.text }}
					numberOfLines={expanded ? undefined : 1}
				>
					Justificado
					{justification?.reason ? ` · ${justification.reason}` : ''}
				</Text>
			</View>
			{expanded && notes ? (
				<Text className="mt-1 text-[11px] italic text-neutral-600">{notes}</Text>
			) : null}
		</TouchableOpacity>
	);
}
