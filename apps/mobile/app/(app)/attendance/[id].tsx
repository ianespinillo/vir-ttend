import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
	AlertCircle,
	ArrowLeft,
	Check,
	CheckCheck,
	Clock,
	CloudOff,
	FileCheck,
	FileText,
	Users,
	X,
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
import { useAuth } from '../../../src/context/auth-context';
import { AttendanceDateBar } from '../../../src/features/attendance/attendance-date-bar';
import { resolveDayDataState } from '../../../src/features/attendance/date-nav';
import {
	getJustifyBlockHint,
	getJustifyRowState,
	isPreceptorRole,
	markAllPresentKeepingJustified,
	toSavableRecords,
} from '../../../src/features/attendance/justification';
import { JustificationBadge } from '../../../src/features/attendance/justification-badge';
import { JustifySheet } from '../../../src/features/attendance/justify-sheet';
import { MonthlyJustificationsModal } from '../../../src/features/attendance/monthly-justifications-modal';
import { attendanceQueries } from '../../../src/features/attendance/queries';
import type {
	AttendanceStatus,
	RecordedAttendanceStatus,
	StudentItem,
} from '../../../src/features/attendance/types';
import {
	type AttendanceDateNav,
	useAttendanceDate,
} from '../../../src/features/attendance/use-attendance-date';
import { useJustifyAttendance } from '../../../src/features/attendance/use-justify-attendance';
import { useBrand } from '../../../src/features/branding/brand-context';
import { useIsOnline } from '../../../src/features/offline/use-is-online';
import { useOutbox } from '../../../src/features/offline/use-outbox';
import { useServerReachability } from '../../../src/features/offline/use-server-reachability';

const NO_STUDENTS: StudentItem[] = [];

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
};

const STATUS_ORDER: AttendanceStatus[] = ['present', 'absent', 'late'];

export default function AttendanceSheetScreen() {
	const params = useLocalSearchParams();

	const courseId = typeof params.id === 'string' ? params.id : '';
	const courseName = typeof params.name === 'string' ? params.name : 'Curso';

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
		<DailySheet
			key={nav.date}
			courseId={courseId}
			courseName={courseName}
			nav={nav}
			hasUserEdits={hasUserEdits}
		/>
	);
}

interface DailySheetProps {
	courseId: string;
	courseName: string;
	nav: AttendanceDateNav;
	hasUserEdits: RefObject<boolean>;
}

function DailySheet({
	courseId,
	courseName,
	nav,
	hasUserEdits,
}: DailySheetProps) {
	const { tokens } = useBrand();
	const router = useRouter();
	const online = useIsOnline();
	const { enqueueDaily, getItemForCourse } = useOutbox();
	const serverStatus = useServerReachability();
	const { user } = useAuth();
	const isPreceptor = isPreceptorRole(user?.role);

	// Day shown by this sheet (`YYYY-MM-DD`, device local time).
	const dateStr = nav.date;
	const outboxItem = getItemForCourse(courseId, dateStr);

	// State for attendance map: studentId -> status (`justified` is read from the
	// server and never written back by this screen).
	const [attendanceMap, setAttendanceMap] = useState<
		Record<string, RecordedAttendanceStatus>
	>({});
	const [justifyTarget, setJustifyTarget] = useState<{
		studentId: string;
		recordId: string;
		name: string;
	} | null>(null);
	const [isMonthOpen, setIsMonthOpen] = useState(false);
	const justify = useJustifyAttendance();
	const [isSaving, setIsSaving] = useState(false);
	// `hasUserEdits`: once the user edits, server data must not overwrite them.

	// Students of the course: shared key, filled by the offline preload.
	const {
		data: studentsData,
		isLoading: isLoadingStudents,
		fetchStatus: studentsFetchStatus,
		error: studentsError,
	} = useQuery({
		...attendanceQueries.courseStudents(courseId),
		enabled: !!courseId,
	});

	// The day's existing attendance (full roster, `status` unset when not taken).
	const {
		data: existingAttendance,
		isLoading: isLoadingDay,
		fetchStatus: dayFetchStatus,
		isError: isDayError,
		refetch: refetchDay,
	} = useQuery({
		...attendanceQueries.dailyAttendance(courseId, dateStr),
		enabled: !!courseId,
	});
	const dayState = resolveDayDataState({
		isToday: nav.isToday,
		hasData: existingAttendance !== undefined,
		hasOutboxItem: Boolean(outboxItem),
		isLoading: isLoadingDay,
		isPaused: dayFetchStatus === 'paused',
		isError: isDayError,
	});

	const students = studentsData ?? NO_STUDENTS;
	// Offline and never downloaded: the query is paused, not loading or failed.
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
				// 'justified' is kept as is; it is never part of the saved payload.
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

	const applyStatusChange = (studentId: string, status: AttendanceStatus) => {
		hasUserEdits.current = true;
		setAttendanceMap((prev) => ({
			...prev,
			[studentId]: status,
		}));
	};

	// Changing a justified student's status deletes the justification on save,
	// so ask for confirmation instead of applying it on a single tap.
	const handleStatusChange = (
		studentId: string,
		studentName: string,
		status: AttendanceStatus,
	) => {
		if (attendanceMap[studentId] !== 'justified') {
			applyStatusChange(studentId, status);
			return;
		}
		Alert.alert(
			'Quitar justificación',
			`${studentName} tiene una justificación. Si cambiás el estado se va a borrar al guardar. ¿Continuar?`,
			[
				{ text: 'Cancelar', style: 'cancel' },
				{
					text: 'Cambiar estado',
					style: 'destructive',
					onPress: () => applyStatusChange(studentId, status),
				},
			],
		);
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

	// Server-stored records of the day, by student (ids, justifications).
	const recordByStudent = useMemo(
		() =>
			new Map((existingAttendance?.records ?? []).map((r) => [r.studentId, r])),
		[existingAttendance],
	);
	// Justifying is online-only and blocked while the day has outbox items.
	const justifyBlockHint = getJustifyBlockHint({
		online,
		hasOutboxItem: Boolean(outboxItem),
	});
	const justifyRowStates = useMemo(() => {
		const states = new Map<string, { visible: boolean; enabled: boolean }>();
		for (const s of students) {
			const record = recordByStudent.get(s.id);
			states.set(
				s.id,
				getJustifyRowState({
					isPreceptor,
					savedStatus: record?.status,
					localStatus: attendanceMap[s.id],
					recordId: record?.id,
					blockHint: justifyBlockHint,
				}),
			);
		}
		return states;
	}, [students, recordByStudent, attendanceMap, isPreceptor, justifyBlockHint]);
	const hasJustifiableRows = [...justifyRowStates.values()].some(
		(state) => state.visible,
	);

	const openJustify = (student: StudentItem) => {
		const recordId = recordByStudent.get(student.id)?.id;
		if (!recordId) return;
		justify.reset();
		setJustifyTarget({
			studentId: student.id,
			recordId,
			name: `${student.lastName}, ${student.firstName}`,
		});
	};

	const closeJustify = () => {
		if (justify.isPending) return;
		setJustifyTarget(null);
		justify.reset();
	};

	const confirmJustify = (payload: { reason: string; notes?: string }) => {
		if (!justifyTarget) return;
		const { studentId, recordId } = justifyTarget;
		justify.mutate(
			{ recordId, courseId, date: dateStr, ...payload },
			{
				onSuccess: () => {
					// Keep the local state in step so saving never sends the stale
					// 'absent' back over the new justified status.
					setAttendanceMap((prev) => ({ ...prev, [studentId]: 'justified' }));
					setJustifyTarget(null);
					justify.reset();
				},
			},
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
			else if (status === 'late') late++;
			else if (status === 'justified') justified++;
		}
		return { present, absent, late, justified, total: students.length };
	}, [attendanceMap, students]);

	const handleSave = async () => {
		if (students.length === 0) return;
		setIsSaving(true);
		try {
			// Justified students are left out: their status belongs to the justification.
			const records = toSavableRecords(attendanceMap);
			if (records.length === 0) {
				Alert.alert('Sin cambios', 'No hay asistencia para guardar.');
				return;
			}

			await enqueueDaily({
				courseId,
				courseName,
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
		<SafeAreaView edges={['bottom']} className="flex-1 bg-slate-50">
			{/* Top Bar / Course Header */}
			<View className="border-b border-slate-200 bg-white px-5 py-4">
				<View className="flex-row items-center justify-between">
					<View className="flex-1">
						<Text className="text-xl font-bold text-slate-900">{courseName}</Text>
					</View>

					<TouchableOpacity
						onPress={markAllPresent}
						className="flex-row items-center rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 active:bg-emerald-100"
					>
						<CheckCheck size={16} color="#059669" />
						<Text className="ml-1.5 text-xs font-bold text-emerald-700">
							Todos presentes
						</Text>
					</TouchableOpacity>
				</View>

				<AttendanceDateBar nav={nav} />

				{isPreceptor ? (
					<TouchableOpacity
						onPress={() => setIsMonthOpen(true)}
						className="mt-3 flex-row items-center self-start rounded-lg border border-primary-200 bg-primary-50 px-3 py-1.5 active:bg-primary-100"
					>
						<FileCheck size={14} color={tokens.primary} />
						<Text className="ml-1.5 text-xs font-bold text-primary-700">
							Justificaciones del mes
						</Text>
					</TouchableOpacity>
				) : null}

				{/* Summary badges */}
				<View className="mt-3.5 flex-row space-x-2">
					<View className="flex-1 flex-row items-center justify-center rounded-lg bg-emerald-50 py-1.5 border border-emerald-100">
						<Text className="text-xs font-bold text-emerald-700">
							{counts.present} P
						</Text>
					</View>
					<View className="flex-1 flex-row items-center justify-center rounded-lg bg-red-50 py-1.5 border border-red-100">
						<Text className="text-xs font-bold text-red-700">{counts.absent} A</Text>
					</View>
					<View className="flex-1 flex-row items-center justify-center rounded-lg bg-amber-50 py-1.5 border border-amber-100">
						<Text className="text-xs font-bold text-amber-700">{counts.late} T</Text>
					</View>
					{counts.justified > 0 ? (
						<View className="flex-1 flex-row items-center justify-center rounded-lg bg-primary-50 py-1.5 border border-primary-100">
							<Text className="text-xs font-bold text-primary-700">
								{counts.justified} J
							</Text>
						</View>
					) : null}
					<View className="flex-1 flex-row items-center justify-center rounded-lg bg-slate-100 py-1.5">
						<Text className="text-xs font-bold text-slate-600">
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
							? { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }
							: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }
					}
				>
					<View className="flex-row items-center">
						{outboxItem.error?.isPermanent ? (
							<AlertCircle size={15} color="#DC2626" />
						) : (
							<Clock size={15} color="#D97706" />
						)}
						<Text
							className="ml-2 font-bold text-xs"
							style={{
								color: outboxItem.error?.isPermanent ? '#991B1B' : '#92400E',
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
						<Text className="mt-1 text-xs text-red-700">
							{outboxItem.error.message}
						</Text>
					) : null}
					<Text
						className="mt-0.5 text-[11px]"
						style={{
							color: outboxItem.error?.isPermanent ? '#B91C1C' : '#B45309',
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
					<ActivityIndicator size="large" color={tokens.primary} />
					<Text className="mt-3 text-sm text-slate-500">
						Cargando nómina de alumnos...
					</Text>
				</View>
			) : isOfflineWithoutRoster ? (
				<View className="flex-1 items-center justify-center px-6">
					<CloudOff size={36} color="#94A3B8" />
					<Text className="mt-2 text-center text-sm font-medium text-slate-700">
						Sin conexión. La lista de alumnos de este curso todavía no se descargó.
					</Text>
				</View>
			) : studentsError && studentsData === undefined ? (
				<View className="flex-1 items-center justify-center px-6">
					<AlertCircle size={36} color="#EF4444" />
					<Text className="mt-2 text-center text-sm font-medium text-slate-700">
						No se pudo cargar la lista de alumnos.
					</Text>
				</View>
			) : students.length === 0 ? (
				<View className="flex-1 items-center justify-center px-6">
					<Users size={36} color="#94A3B8" />
					<Text className="mt-2 text-base font-semibold text-slate-700">
						Curso sin alumnos registrados
					</Text>
				</View>
			) : dayState === 'loading' ? (
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator size="large" color={tokens.primary} />
					<Text className="mt-3 text-sm text-slate-500">
						Cargando asistencia del {nav.label}...
					</Text>
				</View>
			) : dayState === 'offline-empty' ? (
				<View className="flex-1 items-center justify-center px-6">
					<CloudOff size={36} color="#94A3B8" />
					<Text className="mt-2 text-center text-sm font-medium text-slate-700">
						Sin conexión: no hay datos guardados para esta fecha.
					</Text>
				</View>
			) : dayState === 'error' ? (
				<View className="flex-1 items-center justify-center px-6">
					<AlertCircle size={36} color="#EF4444" />
					<Text className="mt-2 text-center text-sm font-medium text-slate-700">
						No se pudo cargar la asistencia de esta fecha.
					</Text>
					<TouchableOpacity
						onPress={() => refetchDay()}
						className="mt-3 rounded-xl border border-primary-200 bg-primary-50 px-4 py-2 active:bg-primary-100"
					>
						<Text className="text-xs font-bold text-primary-700">Reintentar</Text>
					</TouchableOpacity>
				</View>
			) : (
				<ScrollView className="flex-1 px-4 py-3">
					{hasJustifiableRows && justifyBlockHint ? (
						<View className="mb-2.5 flex-row items-center rounded-xl border border-slate-200 bg-slate-100 px-3 py-2">
							<FileText size={13} color="#64748B" />
							<Text className="ml-2 flex-1 text-xs text-slate-600">
								{justifyBlockHint}
							</Text>
						</View>
					) : null}
					{students.map((student, index) => {
						const currentStatus = attendanceMap[student.id] || 'present';
						const record = recordByStudent.get(student.id);
						const justifyState = justifyRowStates.get(student.id);
						return (
							<View
								key={student.id}
								className="mb-2.5 flex-row items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm"
							>
								{/* Student Info */}
								<View className="flex-1 pr-2">
									<View className="flex-row items-center">
										<Text className="mr-2 text-xs font-bold text-slate-400">
											#{index + 1}
										</Text>
										<Text
											className="text-sm font-semibold text-slate-900"
											numberOfLines={1}
										>
											{student.lastName}, {student.firstName}
										</Text>
									</View>
									{student.documentNumber && (
										<Text className="ml-5 text-xs text-slate-400">
											DNI: {student.documentNumber}
										</Text>
									)}
									{currentStatus === 'justified' ? (
										<View className="ml-5">
											<JustificationBadge justification={record?.justification} />
										</View>
									) : justifyState?.visible ? (
										<TouchableOpacity
											onPress={() => openJustify(student)}
											disabled={!justifyState.enabled}
											className="ml-5 mt-1.5 flex-row items-center self-start rounded-md px-1 py-1"
											style={{ opacity: justifyState.enabled ? 1 : 0.4 }}
										>
											<FileText size={13} color={tokens.primary} />
											<Text className="ml-1 text-xs font-bold text-primary">
												Justificar
											</Text>
										</TouchableOpacity>
									) : null}
								</View>

								{/* Segmented Controls: P | A | T */}
								<View className="flex-row items-center rounded-lg border border-slate-200 bg-slate-100 p-1">
									{STATUS_ORDER.map((status, i) => {
										const isActive = currentStatus === status;
										const label = status[0].toUpperCase();
										const colors = statusStyles[status];
										return (
											<TouchableOpacity
												key={status}
												onPress={() =>
													handleStatusChange(
														student.id,
														`${student.firstName} ${student.lastName}`,
														status,
													)
												}
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
														color: isActive ? colors.activeText : '#475569', // slate-600
													}}
												>
													{label}
												</Text>
											</TouchableOpacity>
										);
									})}
								</View>
							</View>
						);
					})}
					<View className="h-6" />
				</ScrollView>
			)}

			{/* Sticky Bottom Confirmation Bar */}
			{students.length > 0 && dayState === 'ready' && (
				<View className="border-t border-slate-200 bg-white px-5 py-4 shadow-lg">
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

			<JustifySheet
				visible={justifyTarget !== null}
				studentName={justifyTarget?.name}
				isSubmitting={justify.isPending}
				errorMessage={justify.errorMessage}
				onCancel={closeJustify}
				onConfirm={confirmJustify}
			/>
			{isPreceptor ? (
				<MonthlyJustificationsModal
					visible={isMonthOpen}
					onClose={() => setIsMonthOpen(false)}
					courseId={courseId}
					courseName={courseName}
					date={dateStr}
				/>
			) : null}
		</SafeAreaView>
	);
}
