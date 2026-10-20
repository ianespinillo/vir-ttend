import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useThemeColors } from '../theme/use-theme-colors';
import type { AttendanceStatus, RecordedAttendanceStatus } from './types';

// NativeWind crash workaround: className must stay STATIC per render.
// Dynamic visual state goes through inline `style` so css-interop never
// adds CSS variables after the initial render (which triggers its upgrade
// warning path and crashes with "Couldn't find a navigation context").
const statusButtonActiveStyle = {
	shadowColor: '#000',
	shadowOffset: { width: 0, height: 1 },
	shadowOpacity: 0.05,
	shadowRadius: 2,
	elevation: 2,
} as const;

const statusStyles: Record<
	AttendanceStatus,
	{ activeBackground: string; activeText: string }
> = {
	present: { activeBackground: '#059669', activeText: '#FFFFFF' }, // emerald-600
	absent: { activeBackground: '#DC2626', activeText: '#FFFFFF' }, // red-600
	late: { activeBackground: '#F59E0B', activeText: '#FFFFFF' }, // amber-500
	late_beyond_tolerance: { activeBackground: '#EA580C', activeText: '#FFFFFF' }, // orange-600
};

const STATUS_ORDER: AttendanceStatus[] = [
	'present',
	'absent',
	'late',
	'late_beyond_tolerance',
];

// Short button labels: P(resente), A(usente), T(arde), TF (tarde fuera de tolerancia).
const STATUS_LABEL: Record<AttendanceStatus, string> = {
	present: 'P',
	absent: 'A',
	late: 'T',
	late_beyond_tolerance: 'TF',
};

interface Props {
	value: RecordedAttendanceStatus;
	onSelect: (status: AttendanceStatus) => void;
}

/** Segmented control P | A | T | TF shared by the daily and workshop sheets. */
export function StatusPicker({ value, onSelect }: Props) {
	const theme = useThemeColors();
	return (
		<View className="flex-row items-center rounded-lg border border-border bg-muted p-1">
			{STATUS_ORDER.map((status, i) => {
				const isActive = value === status;
				const colors = statusStyles[status];
				return (
					<TouchableOpacity
						key={status}
						onPress={() => onSelect(status)}
						className={`h-9 w-9 items-center justify-center rounded-md ${
							i > 0 ? 'ml-1' : ''
						}`}
						style={
							isActive
								? {
										backgroundColor: colors.activeBackground,
										...statusButtonActiveStyle,
									}
								: undefined
						}
					>
						<Text
							className="text-sm font-bold"
							style={{
								color: isActive ? colors.activeText : theme.neutral600,
							}}
						>
							{STATUS_LABEL[status]}
						</Text>
					</TouchableOpacity>
				);
			})}
		</View>
	);
}
