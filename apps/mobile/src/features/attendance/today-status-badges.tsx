import { AlertCircle, CheckCircle, Clock } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';
import { describeOutboxBadge } from '../offline/outbox-display';
import type { OutboxItem } from '../offline/outbox-types';
import { useThemeColors } from '../theme/use-theme-colors';
import {
	type TakenState,
	dayAttendancePercent,
	formatDayCounts,
	formatPercent,
} from './taken';

interface Props {
	taken: TakenState;
	outboxItem?: Pick<OutboxItem, 'status' | 'error'>;
}

/**
 * Today's state of a course/subject card: "Lista tomada" (with the day's
 * P/A/T counts) or "Pendiente de toma", plus the outbox sync badge.
 */
export function TodayStatusBadges({ taken, outboxItem }: Props) {
	// NativeWind: className stays static, the tone is applied through inline style.
	const theme = useThemeColors();
	const TAKEN = theme.status.success;
	const PENDING_TAKE = theme.neutralTone;
	const OUTBOX_PENDING = theme.status.warning;
	const OUTBOX_ERROR = theme.status.danger;
	const outbox = outboxItem ? describeOutboxBadge(outboxItem) : null;
	const outboxColors = outbox?.tone === 'error' ? OUTBOX_ERROR : OUTBOX_PENDING;

	if (taken.kind === 'unknown' && !outbox) return null;

	const todayPercent =
		taken.kind === 'taken' ? dayAttendancePercent(taken.counts) : null;

	return (
		<View className="mt-2">
			<View className="flex-row flex-wrap items-center">
				{taken.kind === 'taken' ? (
					<View
						className="mb-1 mr-2 flex-row items-center rounded-md border px-2 py-0.5"
						style={{ backgroundColor: TAKEN.background, borderColor: TAKEN.border }}
					>
						<CheckCircle size={11} color={TAKEN.text} />
						<Text
							className="ml-1 text-[11px] font-semibold"
							style={{ color: TAKEN.text }}
						>
							Lista tomada · {formatDayCounts(taken.counts)}
						</Text>
					</View>
				) : taken.kind === 'pending' ? (
					<View
						className="mb-1 mr-2 rounded-md border px-2 py-0.5"
						style={{
							backgroundColor: PENDING_TAKE.background,
							borderColor: PENDING_TAKE.border,
						}}
					>
						<Text
							className="text-[11px] font-semibold"
							style={{ color: PENDING_TAKE.text }}
						>
							Pendiente de toma
						</Text>
					</View>
				) : null}

				{outbox ? (
					<View
						className="mb-1 flex-row items-center rounded-md border px-2 py-0.5"
						style={{
							backgroundColor: outboxColors.background,
							borderColor: outboxColors.border,
						}}
					>
						{outbox.tone === 'error' ? (
							<AlertCircle size={11} color={outboxColors.text} />
						) : (
							<Clock size={11} color={outboxColors.text} />
						)}
						<Text
							className="ml-1 text-[11px] font-semibold"
							style={{ color: outboxColors.text }}
						>
							{outbox.label}
						</Text>
					</View>
				) : null}
			</View>

			{todayPercent !== null ? (
				<Text className="text-[11px] text-muted-foreground">
					Asistencia de hoy: {formatPercent(todayPercent)}
				</Text>
			) : null}
		</View>
	);
}
