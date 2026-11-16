import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
	AlertCircle,
	BookOpen,
	CheckCheck,
	Clock,
	CloudOff,
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
import {
	classDaysOfSubject,
	resolveDayDataState,
} from '../../../../src/features/attendance/date-nav';
import {
	markAllPresentKeepingJustified,
	toSavableRecords,
} from '../../../../src/features/attendance/justification';
import { JustificationBadge } from '../../../../src/features/attendance/justification-badge';
import { attendanceQueries } from '../../../../src/features/attendance/queries';
import { queryKeys } from '../../../../src/features/attendance/query-keys';
import type {
	AttendanceStatus,
	RecordedAttendanceStatus,
	StudentItem,
} from '../../../../src/features/attendance/types';
import {
	type AttendanceDateNav,
	useAttendanceDate,
} from '../../../../src/features/attendance/use-attendance-date';
import { useIsOnline } from '../../../../src/features/offline/use-is-online';
import { useOutbox } from '../../../../src/features/offline/use-outbox';
import { useServerReachability } from '../../../../src/features/offline/use-server-reachability';
import { useThemeColors } from '../../../../src/features/theme/use-theme-colors';

const NO_STUDENTS: StudentItem[] = [];

// NativeWind crash workaround: className must stay STATIC per render.
// Dynamic visual state goes through inline `style` so css-interop never
// adds CSS variables after the initial render.
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

const STATUS_ORDER: AttendanceStatus[] = ['present', 'absent', 'late'];

export default function SubjectAttendanceScreen() {
	const params = useLocalSearchParams();

	const subjectId = typeof params.subjectId === 'string' ? params.subjectId : '';
	const subjectName = typeof params.name === 'string' ? params.name : 'Materia';
	const courseName =
		typeof params.courseName === 'string' ? params.courseName : '';
	const courseIdParam =
		typeof params.courseId === 'string' ? params.courseId : '';

	// The subject's weekly schedule (cached by the home screen / preload) says
	// which days can be selected; unknown schedule falls back to any school day
	// and the API still rejects a day without class.
	const { data: mySubjects } = useQuery(attendanceQueries.mySubjects());
	const classDays = useMemo(
		() => classDaysOfSubject(mySubjects?.find((s) => s.subjectId === subjectId)),
		[mySubjects, subjectId],
	);

	// Set by the sheet once the user edits; read here to confirm before the
	// selected day changes (the sheet below remounts per day).
	const hasUserEdits = useRef(false);
	const nav = useAttendanceDate({
		dateParam: typeof params.date === 'string' ? params.date : undefined,
		classDays,
		hasUnsavedChanges: () => hasUserEdits.current,
		onDateChanged: () => {
			hasUserEdits.current = false;
		},
	});

	// `key` gives every day a fresh sheet: no edits carry over.
	return (
		<SubjectSheet
			key={nav.date}
			subjectId={subjectId}
			subjectName={subjectName}
			courseName={courseName}
			courseIdParam={courseIdParam}
			nav={nav}
			hasUserEdits={hasUserEdits}
		/>
	);
}

interface SubjectSheetProps {
	subjectId: string;
	subjectName: string;
	courseName: string;
	courseIdParam: string;
	nav: AttendanceDateNav;
	hasUserEdits: RefObject<boolean>;
}

function SubjectSheet({
	subjectId,
	subjectName,
	courseName,
	courseIdParam,
	nav,
	hasUserEdits,
}: SubjectSheetProps) {
	const theme = useThemeColors();
	const router = useRouter();
	const online = useIsOnline();
	const { enqueueSubject, getItemForSubject } = useOutbox();
	const serverStatus = useServerReachability();

	// Day shown by this sheet (`YYYY-MM-DD`, device local time).
	const dateStr = nav.date;
	const outboxItem = getItemForSubject(subjectId, dateStr);

	// State for attendance map: studentId -> status. `justified` rows come from
	// the server (set by a preceptor): they are read-only here and never saved.
	const [attendanceMap, setAttendanceMap] = useState<
		Record<string, RecordedAttendanceStatus>
	>({});
	const [isSaving, setIsSaving] = useState(false);

	// Students of the subject for the shown day: a mixed-slot workshop subject
	// lists the commission of that weekday. Offline, with no roster cached for
	// the day, the undated roster the preload cached (union of the subject's
	// commissions) stands in; it only differs for mixed-slot subjects.
	const queryClient = useQueryClient();
	const {
		data: studentsData,
		isLoading: isLoadingStudents,
		fetchStatus: studentsFetchStatus,
		error: studentsError,
	} = useQuery({
		...attendanceQueries.subjectStudents(subjectId, dateStr),
		enabled: !!subjectId,
		placeholderData: () =>
			online
				? undefined
				: queryClient.getQueryData<StudentItem[]>(
						queryKeys.subjectStudents(subjectId),
					),
	});

	// The day's existing attendance for the subject.
	const {
		data: existingAttendance,
		isLoading: isLoadingDay,
		fetchStatus: dayFetchStatus,
		isError: isDayError,
		refetch: refetchDay,
	} = useQuery({
		...attendanceQueries.subjectAttendance(subjectId, dateStr),
		enabled: !!subjectId,
	});
	const dayState = resolveDayDataState({
		isToday: nav.isToday,
		hasData: existingAttendance !== undefined,
		hasOutboxItem: Boolean(outboxItem),
		isLoading: isLoadingDay,
		isPaused: dayFetchStatus === 'paused',
		isError: isDayError,
	});

	const resolvedCourseId =
		courseIdParam || existingAttendance?.courseId || outboxItem?.courseId || '';
	const students = studentsData ?? NO_STUDENTS;
	const isOfflineWithoutRoster =
		studentsData === undefined && studentsFetchStatus === 'paused';

	// Populate attendance state from outbox, existing attendance or default
	useEffect(() => {
		if (!students.length || hasUserEdits.current) return;

		const map: Record<string, RecordedAttendanceStatus> = {};
		const sourceRecords = outboxItem?.records?.length
			? outboxItem.records
			: (existingAttendance?.records ?? []);

		for (const record of sourceRecords) {
			if (record.studentId && record.status) {
				map[record.studentId] = record.status;
			}
		}

		// For students not yet in existing records, default to 'present' for fast workflow
		for (const s of students) {
			if (!map[s.id]) {
				map[s.id] = 'present';
			}
		}

		setAttendanceMap(map);
	}, [students, existingAttendance, outboxItem]);

	const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
		hasUserEdits.current = true;
		setAttendanceMap((prev) => ({
			...prev,
			[studentId]: status,
		}));
	};

	const markAllPresent = () => {
		hasUserEdits.current = true;
		setAttendanceMap((prev) =>
			markAllPresentKeepingJustified(
				students.map((s) => s.id),
				prev,
			),
		);
	};

	// Counts
	const counts = useMemo(() => {
		let present = 0;
		let absent = 0;
		let late = 0;
		let justified = 0;
		for (const status of Object.values(attendanceMap)) {
			if (status === 'present') present++;
			else if (status === 'absent') absent++;
			else if (status === 'late' || status === 'late_beyond_tolerance') late++;
			else if (status === 'justified') justified++;
		}
		return { present, absent, late, justified, total: students.length };
	}, [attendanceMap, students]);

	const handleSave = async () => {
		if (students.length === 0) return;
		if (!resolvedCourseId) {
			Alert.alert(
				'Error',
				'No se pudo determinar el curso de la materia. Conectate a internet para sincronizar.',
			);
			return;
		}

		setIsSaving(true);
		try {
			// Justified students are left out: only preceptors can justify, and
			// sending 'present' (or a stale 'justified') would overwrite it.
			const records = toSavableRecords(attendanceMap);
			if (records.length === 0) {
				Alert.alert('Sin cambios', 'No hay asistencia para guardar.');
				return;
			}

			await enqueueSubject({
				subjectId,
				subjectName,
				courseId: resolvedCourseId,
				courseName,
				date: dateStr,
				records,
			});

			Alert.alert(
				'¡Asistencia Guardada!',
				online
					? `Se registraron ${counts.present} presentes, ${counts.absent} ausentes y ${counts.late} tardanzas para ${subjectName} el ${nav.label}.`
					: `Se guardaron ${counts.present} presentes, ${counts.absent} ausentes y ${counts.late} tardanzas localmente para ${subjectName} el ${nav.label}. Se sincronizarán automáticamente al recuperar conexión.`,
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
			{/* Top Bar / Subject Header */}
			<View className="border-b border-border bg-card px-5 py-4">
				<View className="flex-row items-center justify-between">
					<View className="flex-1 pr-3">
						<Text className="text-xl font-bold text-foreground">{subjectName}</Text>
						{courseName ? (
							<Text className="mt-0.5 text-xs font-semibold text-primary-ink">
								{courseName}
							</Text>
						) : null}
					</View>

					<TouchableOpacity
						onPress={markAllPresent}
						className="flex-row items-center rounded-xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/40 px-3 py-2 active:bg-emerald-100 dark:active:bg-emerald-500/25"
					>
						<CheckCheck size={16} color={theme.status.success.icon} />
						<Text className="ml-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
							Todos presentes
						</Text>
					</TouchableOpacity>
				</View>

				<AttendanceDateBar nav={nav} />

				{/* Summary badges */}
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
					{counts.justified > 0 ? (
						<View className="flex-1 flex-row items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-ink/15 py-1.5 border border-primary-100 dark:border-primary-ink/25">
							<Text className="text-xs font-bold text-primary-700 dark:text-primary-ink">
								{counts.justified} J
							</Text>
						</View>
					) : null}
					<View className="flex-1 flex-row items-center justify-center rounded-lg bg-muted py-1.5">
						<Text className="text-xs font-bold text-neutral-600">
							{counts.total} Total
						</Text>
					</View>
				</View>
			</View>

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
			{isLoadingStudents ? (
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator size="large" color={theme.primaryInk} />
					<Text className="mt-3 text-sm text-muted-foreground">
						Cargando nómina de alumnos...
					</Text>
				</View>
			) : isOfflineWithoutRoster ? (
				<View className="flex-1 items-center justify-center px-6">
					<CloudOff size={36} color={theme.neutral400} />
					<Text className="mt-2 text-center text-sm font-medium text-neutral-700">
						Sin conexión. La lista de alumnos de esta materia todavía no se descargó.
					</Text>
				</View>
			) : studentsError && studentsData === undefined ? (
				<View className="flex-1 items-center justify-center px-6">
					<AlertCircle size={36} color={theme.destructive} />
					<Text className="mt-2 text-center text-sm font-medium text-neutral-700">
						No se pudo cargar la lista de alumnos.
					</Text>
				</View>
			) : students.length === 0 ? (
				<View className="flex-1 items-center justify-center px-6">
					<Users size={36} color={theme.neutral400} />
					<Text className="mt-2 text-base font-semibold text-neutral-700">
						Materia sin alumnos registrados
					</Text>
				</View>
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
						Sin conexión: no hay datos guardados para esta fecha.
					</Text>
				</View>
			) : dayState === 'error' ? (
				<View className="flex-1 items-center justify-center px-6">
					<AlertCircle size={36} color={theme.destructive} />
					<Text className="mt-2 text-center text-sm font-medium text-neutral-700">
						No se pudo cargar la asistencia de esta fecha.
					</Text>
					<TouchableOpacity
						onPress={() => refetchDay()}
						className="mt-3 rounded-xl border border-primary-200 dark:border-primary-ink/40 bg-primary-50 dark:bg-primary-ink/15 px-4 py-2 active:bg-primary-100 dark:active:bg-primary-ink/25"
					>
						<Text className="text-xs font-bold text-primary-700 dark:text-primary-ink">
							Reintentar
						</Text>
					</TouchableOpacity>
				</View>
			) : (
				<ScrollView className="flex-1 px-4 py-3">
					{students.map((student, index) => {
						const currentStatus = attendanceMap[student.id] || 'present';
						return (
							<View
								key={student.id}
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
											{student.lastName}, {student.firstName}
										</Text>
									</View>
									{student.documentNumber && (
										<Text className="ml-5 text-xs text-neutral-400">
											DNI: {student.documentNumber}
										</Text>
									)}
								</View>

								{/* Justified by a preceptor: read-only for teachers */}
								{currentStatus === 'justified' ? (
									<JustificationBadge />
								) : (
									/* Segmented Controls: P | A | T */
									<View className="flex-row items-center rounded-lg border border-border bg-muted p-1">
										{STATUS_ORDER.map((status, i) => {
											const isActive = currentStatus === status;
											const label = status[0].toUpperCase();
											const colors = statusStyles[status];
											return (
												<TouchableOpacity
													key={status}
													onPress={() => handleStatusChange(student.id, status)}
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
														{label}
													</Text>
												</TouchableOpacity>
											);
										})}
									</View>
								)}
							</View>
						);
					})}
					<View className="h-6" />
				</ScrollView>
			)}

			{/* Sticky Bottom Confirmation Bar */}
			{students.length > 0 && dayState === 'ready' && (
				<View className="border-t border-border bg-card px-5 py-4 shadow-lg">
					<TouchableOpacity
						onPress={handleSave}
						disabled={isSaving}
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
		</SafeAreaView>
	);
}
