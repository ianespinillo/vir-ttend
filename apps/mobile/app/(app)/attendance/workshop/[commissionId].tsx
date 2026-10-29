import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
	AlertCircle,
	CalendarOff,
	CheckCheck,
	Clock,
	CloudOff,
	Info,
	Users,
} from 'lucide-react-native';
import React, {
	type RefObject,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import {
	ActivityIndicator,
	Alert,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AttendanceDateBar } from '../../../../src/features/attendance/attendance-date-bar';
import { resolveDayDataState } from '../../../../src/features/attendance/date-nav';
import { toSavableRecords } from '../../../../src/features/attendance/justification';
import {
	HINT_NOT_HELD_OFFLINE,
	NOT_HELD_COPY,
} from '../../../../src/features/attendance/not-held';
import { NotHeldLookupError } from '../../../../src/features/attendance/not-held-lookup-error';
import { NotHeldNotice } from '../../../../src/features/attendance/not-held-notice';
import { NotHeldSheet } from '../../../../src/features/attendance/not-held-sheet';
import { attendanceQueries } from '../../../../src/features/attendance/queries';
import { StatusPicker } from '../../../../src/features/attendance/status-picker';
import type { AttendanceStatus } from '../../../../src/features/attendance/types';
import {
	type AttendanceDateNav,
	useAttendanceDate,
} from '../../../../src/features/attendance/use-attendance-date';
import { useWorkshopNotHeld } from '../../../../src/features/attendance/use-session-not-held';
import { useIsOnline } from '../../../../src/features/offline/use-is-online';
import { useOutbox } from '../../../../src/features/offline/use-outbox';
import { useServerReachability } from '../../../../src/features/offline/use-server-reachability';
import { useThemeColors } from '../../../../src/features/theme/use-theme-colors';

export default function WorkshopAttendanceScreen() {
	const params = useLocalSearchParams();

	const commissionId =
		typeof params.commissionId === 'string' ? params.commissionId : '';
	const commissionLabel =
		typeof params.name === 'string' ? params.name : 'Comisión de taller';

	// Set by the sheet once the user edits; read here to confirm before the
	// selected day changes (the sheet below remounts per day).
	const hasUserEdits = useRef(false);
	const nav = useAttendanceDate({
		dateParam: typeof params.date === 'string' ? params.date : undefined,
		classDays: null,
		hasUnsavedChanges: () => hasUserEdits.current,
		onDateChanged: () => {
			hasUserEdits.current = false;
		},
	});

	// `key` gives every day a fresh sheet: no edits or selections carry over.
	return (
		<WorkshopSheet
			key={nav.date}
			commissionId={commissionId}
			commissionLabel={commissionLabel}
			nav={nav}
			hasUserEdits={hasUserEdits}
		/>
	);
}

interface WorkshopSheetProps {
	commissionId: string;
	commissionLabel: string;
	nav: AttendanceDateNav;
	hasUserEdits: RefObject<boolean>;
}

function WorkshopSheet({
	commissionId,
	commissionLabel,
	nav,
	hasUserEdits,
}: WorkshopSheetProps) {
	const theme = useThemeColors();
	const router = useRouter();
	const online = useIsOnline();
	const { enqueueWorkshop, getItemForCommission } = useOutbox();
	const serverStatus = useServerReachability();

	// Day shown by this sheet (`YYYY-MM-DD`, device local time).
	const dateStr = nav.date;
	const outboxItem = getItemForCommission(commissionId, dateStr);

	const [attendanceMap, setAttendanceMap] = useState<
		Record<string, AttendanceStatus>
	>({});
	const [isSaving, setIsSaving] = useState(false);
	const [isNotHeldOpen, setIsNotHeldOpen] = useState(false);
	const notHeld = useWorkshopNotHeld();

	// The commission's roster comes with the day's statuses (`status` unset
	// when not taken); the offline preload fills today's entry.
	const {
		data: workshop,
		isLoading,
		fetchStatus,
		isError,
		refetch,
	} = useQuery({
		...attendanceQueries.workshopAttendance(commissionId, dateStr),
		enabled: !!commissionId,
	});
	const dayState = resolveDayDataState({
		isToday: false,
		hasData: workshop !== undefined,
		hasOutboxItem: false,
		isLoading,
		isPaused: fetchStatus === 'paused',
		isError,
	});

	// Informational only: the API accepts attendance on any day.
	const { data: myCommissions } = useQuery(
		attendanceQueries.myWorkshopCommissions(dateStr),
	);
	const hasNoWorkshop =
		myCommissions?.find((c) => c.commissionId === commissionId)
			?.hasWorkshopToday === false;

	// Not-held status of the workshop on this day.
	const {
		data: notHeldStatus,
		isError: isNotHeldError,
		refetch: refetchNotHeld,
	} = useQuery({
		...attendanceQueries.workshopNotHeld(commissionId, dateStr),
		enabled: !!commissionId,
	});
	const isNotHeld = notHeldStatus?.notHeld === true;
	// Online and not verified yet (loading or failed): saving and marking wait.
	// Offline with no cached status stays usable; the server still rejects a
	// marked day when the outbox syncs.
	const isNotHeldUnverified = online && notHeldStatus === undefined;
	const isNotHeldBusy = notHeld.mark.isPending || notHeld.unmark.isPending;
	const canMarkNotHeld = online && notHeldStatus !== undefined && !isNotHeldBusy;

	const students = workshop?.records ?? [];

	// Populate attendance state from outbox, existing attendance or default
	useEffect(() => {
		if (!workshop || hasUserEdits.current) return;

		const map: Record<string, AttendanceStatus> = {};
		const sourceRecords = outboxItem?.records?.length
			? outboxItem.records
			: workshop.records;
		for (const record of sourceRecords) {
			if (record.studentId && record.status && record.status !== 'justified') {
				map[record.studentId] = record.status;
			}
		}
		// Students without a status default to 'present' for a fast workflow.
		for (const s of workshop.records) {
			if (!map[s.studentId]) map[s.studentId] = 'present';
		}
		setAttendanceMap(map);
	}, [workshop, outboxItem, isNotHeld]);

	const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
		hasUserEdits.current = true;
		setAttendanceMap((prev) => ({ ...prev, [studentId]: status }));
	};

	const markAllPresent = () => {
		hasUserEdits.current = true;
		setAttendanceMap(
			Object.fromEntries(
				students.map((s) => [s.studentId, 'present' as AttendanceStatus]),
			),
		);
	};

	const counts = useMemo(() => {
		let present = 0;
		let absent = 0;
		let late = 0;
		for (const status of Object.values(attendanceMap)) {
			if (status === 'present') present++;
			else if (status === 'absent') absent++;
			else late++;
		}
		return { present, absent, late, total: students.length };
	}, [attendanceMap, students.length]);

	// Both callbacks run only while this sheet (commission + day) is still
	// mounted, so the local edits cleared here belong to the day acted on.
	const confirmNotHeld = (reason?: string) => {
		notHeld.mark.mutate(
			{ targetId: commissionId, date: dateStr, reason },
			{
				onSuccess: () => {
					hasUserEdits.current = false;
					setIsNotHeldOpen(false);
					notHeld.mark.reset();
				},
			},
		);
	};

	const unmarkNotHeld = () => {
		notHeld.unmark.mutate(
			{ targetId: commissionId, date: dateStr },
			{
				onSuccess: () => {
					hasUserEdits.current = false;
					notHeld.unmark.reset();
				},
			},
		);
	};

	const handleSave = async () => {
		if (students.length === 0 || isNotHeldUnverified || isNotHeld) return;
		setIsSaving(true);
		try {
			const records = toSavableRecords(attendanceMap);
			if (records.length === 0) {
				Alert.alert('Sin cambios', 'No hay asistencia para guardar.');
				return;
			}

			await enqueueWorkshop({
				commissionId,
				commissionLabel,
				date: dateStr,
				records,
			});

			Alert.alert(
				'¡Asistencia Guardada!',
				online
					? `Se registraron ${counts.present} presentes, ${counts.absent} ausentes y ${counts.late} tardanzas para el ${nav.label}.`
					: `Se guardaron ${counts.present} presentes, ${counts.absent} ausentes y ${counts.late} tardanzas para el ${nav.label} localmente. Se sincronizarán automáticamente al recuperar conexión.`,
				[{ text: 'Aceptar', onPress: () => router.back() }],
			);
		} catch (error: unknown) {
			Alert.alert(
				'Error',
				'No se pudo guardar la asistencia en el dispositivo. Intentá nuevamente.',
			);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<SafeAreaView edges={['bottom']} className="flex-1 bg-background">
			{/* Top Bar / Commission Header */}
			<View className="border-b border-border bg-card px-5 py-4">
				<View className="flex-row items-center justify-between">
					<View className="flex-1 pr-2">
						<Text className="text-xl font-bold text-foreground">
							{commissionLabel}
						</Text>
					</View>

					{isNotHeld ? null : (
						<TouchableOpacity
							onPress={markAllPresent}
							className="flex-row items-center rounded-xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/40 px-3 py-2 active:bg-emerald-100 dark:active:bg-emerald-500/25"
						>
							<CheckCheck size={16} color={theme.status.success.icon} />
							<Text className="ml-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
								Todos presentes
							</Text>
						</TouchableOpacity>
					)}
				</View>

				<AttendanceDateBar nav={nav} />

				{isNotHeld ? null : (
					<TouchableOpacity
						onPress={() => {
							notHeld.mark.reset();
							setIsNotHeldOpen(true);
						}}
						disabled={!canMarkNotHeld}
						className="mt-3 flex-row items-center self-start rounded-lg border px-3 py-1.5"
						style={{
							backgroundColor: theme.status.warning.background,
							borderColor: theme.status.warning.border,
							opacity: canMarkNotHeld ? 1 : 0.4,
						}}
					>
						<CalendarOff size={14} color={theme.status.warning.icon} />
						<Text
							className="ml-1.5 text-xs font-bold"
							style={{ color: theme.status.warning.strongText }}
						>
							{NOT_HELD_COPY.workshop.action}
						</Text>
					</TouchableOpacity>
				)}
				{!online && !isNotHeld ? (
					<Text className="mt-1.5 text-[11px] text-muted-foreground">
						{HINT_NOT_HELD_OFFLINE}
					</Text>
				) : null}

				{hasNoWorkshop ? (
					<View className="mt-3 flex-row items-center rounded-lg border border-border bg-muted px-3 py-2">
						<Info size={13} color={theme.mutedForeground} />
						<Text className="ml-2 flex-1 text-xs text-neutral-600">
							Esta comisión no tiene taller en esta fecha.
						</Text>
					</View>
				) : null}

				{/* Summary badges */}
				{isNotHeld ? null : (
					<View className="mt-3.5 flex-row space-x-2">
						<View className="flex-1 flex-row items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-500/15 py-1.5 border border-emerald-100 dark:border-emerald-500/25">
							<Text className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
								{counts.present} P
							</Text>
						</View>
						<View className="flex-1 flex-row items-center justify-center rounded-lg bg-red-50 dark:bg-red-500/15 py-1.5 border border-red-100 dark:border-red-500/25">
							<Text className="text-xs font-bold text-red-700 dark:text-red-300">
								{counts.absent} A
							</Text>
						</View>
						<View className="flex-1 flex-row items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-500/15 py-1.5 border border-amber-100 dark:border-amber-500/25">
							<Text className="text-xs font-bold text-amber-700 dark:text-amber-300">
								{counts.late} T
							</Text>
						</View>
						<View className="flex-1 flex-row items-center justify-center rounded-lg bg-muted py-1.5">
							<Text className="text-xs font-bold text-neutral-600">
								{counts.total} Total
							</Text>
						</View>
					</View>
				)}
			</View>

			{isNotHeldUnverified && isNotHeldError ? (
				<NotHeldLookupError kind="workshop" onRetry={() => refetchNotHeld()} />
			) : null}

			{/* Outbox Status Banner */}
			{outboxItem && (
				<View
					className="mx-5 mt-4 rounded-xl p-3 border"
					style={
						outboxItem.error?.isPermanent
							? {
									backgroundColor: theme.status.danger.background,
									borderColor: theme.status.danger.border,
								}
							: {
									backgroundColor: theme.status.warning.background,
									borderColor: theme.status.warning.border,
								}
					}
				>
					<View className="flex-row items-center">
						{outboxItem.error?.isPermanent ? (
							<AlertCircle size={15} color={theme.status.danger.icon} />
						) : (
							<Clock size={15} color={theme.status.warning.icon} />
						)}
						<Text
							className="ml-2 font-bold text-xs"
							style={{
								color: outboxItem.error?.isPermanent
									? theme.status.danger.strongText
									: theme.status.warning.strongText,
							}}
						>
							{outboxItem.error?.isPermanent
								? 'Error al sincronizar'
								: serverStatus === 'unreachable'
									? 'No se puede conectar con el servidor · reintentando'
									: outboxItem.status === 'syncing'
										? 'Sincronizando cambios…'
										: 'Cambios pendientes de sincronizar'}
						</Text>
					</View>
					{outboxItem.error?.message ? (
						<Text className="mt-1 text-xs text-red-700 dark:text-red-300">
							{outboxItem.error.message}
						</Text>
					) : null}
					<Text
						className="mt-0.5 text-[11px]"
						style={{
							color: outboxItem.error?.isPermanent
								? theme.status.danger.text
								: theme.status.warning.text,
						}}
					>
						{outboxItem.error?.isPermanent
							? 'Revisá la asistencia y volvé a guardar para reintentar.'
							: 'Los cambios están guardados en tu dispositivo y se sincronizarán automáticamente.'}
					</Text>
				</View>
			)}

			{/* Student Roster */}
			{isNotHeld ? (
				<NotHeldNotice
					kind="workshop"
					reason={notHeldStatus?.reason}
					onUnmark={online ? unmarkNotHeld : undefined}
					isUnmarking={notHeld.unmark.isPending}
					errorMessage={notHeld.unmark.errorMessage}
				/>
			) : dayState === 'loading' ? (
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator size="large" color={theme.primaryInk} />
					<Text className="mt-3 text-sm text-muted-foreground">
						Cargando asistencia del {nav.label}...
					</Text>
				</View>
			) : dayState === 'offline-empty' ? (
				<View className="flex-1 items-center justify-center px-6">
					<CloudOff size={36} color={theme.neutral400} />
					<Text className="mt-2 text-center text-sm font-medium text-neutral-700">
						Sin conexión. La lista de alumnos de esta comisión todavía no se descargó.
					</Text>
				</View>
			) : dayState === 'error' ? (
				<View className="flex-1 items-center justify-center px-6">
					<AlertCircle size={36} color={theme.destructive} />
					<Text className="mt-2 text-center text-sm font-medium text-neutral-700">
						No se pudo cargar la asistencia de esta fecha.
					</Text>
					<TouchableOpacity
						onPress={() => refetch()}
						className="mt-3 rounded-xl border border-primary-200 dark:border-primary-ink/40 bg-primary-50 dark:bg-primary-ink/15 px-4 py-2 active:bg-primary-100 dark:active:bg-primary-ink/25"
					>
						<Text className="text-xs font-bold text-primary-700 dark:text-primary-ink">
							Reintentar
						</Text>
					</TouchableOpacity>
				</View>
			) : students.length === 0 ? (
				<View className="flex-1 items-center justify-center px-6">
					<Users size={36} color={theme.neutral400} />
					<Text className="mt-2 text-base font-semibold text-neutral-700">
						Comisión sin alumnos registrados
					</Text>
				</View>
			) : (
				<ScrollView className="flex-1 px-4 py-3">
					{students.map((student, index) => (
						<View
							key={student.studentId}
							className="mb-2.5 flex-row items-center justify-between rounded-xl border border-border bg-card p-3.5 shadow-sm"
						>
							{/* Student Info */}
							<View className="flex-1 pr-2">
								<View className="flex-row items-center">
									<Text className="mr-2 text-xs font-bold text-neutral-400">
										#{index + 1}
									</Text>
									<Text
										className="text-sm font-semibold text-foreground"
										numberOfLines={1}
									>
										{student.studentName}
									</Text>
								</View>
							</View>

							{/* Segmented Controls: P | A | T | TF */}
							<StatusPicker
								value={attendanceMap[student.studentId] ?? 'present'}
								onSelect={(status) => handleStatusChange(student.studentId, status)}
							/>
						</View>
					))}
					<View className="h-6" />
				</ScrollView>
			)}

			{/* Sticky Bottom Confirmation Bar */}
			{!isNotHeld && students.length > 0 && dayState === 'ready' && (
				<View className="border-t border-border bg-card px-5 py-4 shadow-lg">
					<TouchableOpacity
						onPress={handleSave}
						disabled={isSaving || isNotHeldUnverified}
						className="items-center justify-center rounded-xl bg-primary py-3.5 shadow-sm active:bg-primary-700 disabled:opacity-50"
					>
						{isSaving ? (
							<ActivityIndicator size="small" color="#FFFFFF" />
						) : (
							<Text className="text-base font-bold text-white">
								Guardar Asistencia ({counts.present} P • {counts.absent} A •{' '}
								{counts.late} T)
							</Text>
						)}
					</TouchableOpacity>
				</View>
			)}
			<NotHeldSheet
				visible={isNotHeldOpen}
				kind="workshop"
				savedRecordsCount={students.filter((r) => r.status).length}
				isSubmitting={notHeld.mark.isPending}
				errorMessage={notHeld.mark.errorMessage}
				onCancel={() => {
					if (notHeld.mark.isPending) return;
					setIsNotHeldOpen(false);
					notHeld.mark.reset();
				}}
				onConfirm={confirmNotHeld}
			/>
		</SafeAreaView>
	);
}
