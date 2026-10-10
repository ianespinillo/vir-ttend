import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
	AlertCircle,
	BookOpen,
	Calendar,
	CheckCheck,
	CloudOff,
	Users,
} from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { attendanceQueries } from '../../../../src/features/attendance/queries';
import type {
	AttendanceStatus,
	StudentItem,
} from '../../../../src/features/attendance/types';
import { toLocalDateString } from '../../../../src/lib/date';
import { api } from '../../../../src/services/api';

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
};

const STATUS_ORDER: AttendanceStatus[] = ['present', 'absent', 'late'];

export default function SubjectAttendanceScreen() {
	const params = useLocalSearchParams();
	const router = useRouter();

	const subjectId = typeof params.subjectId === 'string' ? params.subjectId : '';
	const subjectName = typeof params.name === 'string' ? params.name : 'Materia';
	const courseName =
		typeof params.courseName === 'string' ? params.courseName : '';
	const courseIdParam =
		typeof params.courseId === 'string' ? params.courseId : '';

	// Today in YYYY-MM-DD format (device local time)
	const todayStr = useMemo(() => toLocalDateString(), []);

	// State for attendance map: studentId -> status
	const [attendanceMap, setAttendanceMap] = useState<
		Record<string, AttendanceStatus>
	>({});
	const [isSaving, setIsSaving] = useState(false);
	const hasUserEdits = useRef(false);

	// Students of the subject: shared key, populated by the offline preload.
	const {
		data: studentsData,
		isLoading: isLoadingStudents,
		fetchStatus: studentsFetchStatus,
		error: studentsError,
	} = useQuery({
		...attendanceQueries.subjectStudents(subjectId),
		enabled: !!subjectId,
	});

	// Today's existing attendance for the subject.
	const { data: existingAttendance } = useQuery({
		...attendanceQueries.subjectAttendance(subjectId, todayStr),
		enabled: !!subjectId,
	});

	const resolvedCourseId = courseIdParam || existingAttendance?.courseId || '';
	const students = studentsData ?? NO_STUDENTS;
	const isOfflineWithoutRoster =
		studentsData === undefined && studentsFetchStatus === 'paused';

	// Populate attendance state from existing attendance or default
	useEffect(() => {
		if (!students.length || hasUserEdits.current) return;

		const map: Record<string, AttendanceStatus> = {};
		for (const record of existingAttendance?.records ?? []) {
			if (record.studentId && record.status && record.status !== 'justified') {
				map[record.studentId] = record.status as AttendanceStatus;
			}
		}

		// For students not yet in existing records, default to 'present' for fast workflow
		for (const s of students) {
			if (!map[s.id]) {
				map[s.id] = 'present';
			}
		}

		setAttendanceMap(map);
	}, [students, existingAttendance]);

	const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
		hasUserEdits.current = true;
		setAttendanceMap((prev) => ({
			...prev,
			[studentId]: status,
		}));
	};

	const markAllPresent = () => {
		hasUserEdits.current = true;
		const newMap: Record<string, AttendanceStatus> = {};
		for (const s of students) {
			newMap[s.id] = 'present';
		}
		setAttendanceMap(newMap);
	};

	// Counts
	const counts = useMemo(() => {
		let present = 0;
		let absent = 0;
		let late = 0;
		for (const status of Object.values(attendanceMap)) {
			if (status === 'present') present++;
			else if (status === 'absent') absent++;
			else if (status === 'late') late++;
		}
		return { present, absent, late, total: students.length };
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
			const records = Object.entries(attendanceMap).map(([studentId, status]) => ({
				studentId,
				status,
			}));

			await api.post('/attendance/subject', {
				subjectId,
				courseId: resolvedCourseId,
				date: todayStr,
				records,
			});

			Alert.alert(
				'¡Asistencia Guardada!',
				`Se registraron ${counts.present} presentes, ${counts.absent} ausentes y ${counts.late} tardanzas para ${subjectName}.`,
				[{ text: 'Aceptar', onPress: () => router.back() }],
			);
		} catch (error: unknown) {
			const err = error as {
				response?: { data?: { message?: string } };
				message?: string;
			};
			const msg =
				err?.response?.data?.message ||
				err?.message ||
				'Error al registrar asistencia de la materia';
			Alert.alert('Error', typeof msg === 'string' ? msg : 'Error inesperado');
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<SafeAreaView edges={['bottom']} className="flex-1 bg-slate-50">
			{/* Top Bar / Subject Header */}
			<View className="border-b border-slate-200 bg-white px-5 py-4">
				<View className="flex-row items-center justify-between">
					<View className="flex-1 pr-3">
						<Text className="text-xl font-bold text-slate-900">{subjectName}</Text>
						{courseName ? (
							<Text className="mt-0.5 text-xs font-semibold text-indigo-600">
								{courseName}
							</Text>
						) : null}
						<View className="mt-1 flex-row items-center">
							<Calendar size={13} color="#64748B" />
							<Text className="ml-1 text-xs text-slate-500 font-medium">
								Fecha: {todayStr}
							</Text>
						</View>
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
					<View className="flex-1 flex-row items-center justify-center rounded-lg bg-slate-100 py-1.5">
						<Text className="text-xs font-bold text-slate-600">
							{counts.total} Total
						</Text>
					</View>
				</View>
			</View>

			{/* Student Roster */}
			{isLoadingStudents ? (
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator size="large" color="#4F46E5" />
					<Text className="mt-3 text-sm text-slate-500">
						Cargando nómina de alumnos...
					</Text>
				</View>
			) : isOfflineWithoutRoster ? (
				<View className="flex-1 items-center justify-center px-6">
					<CloudOff size={36} color="#94A3B8" />
					<Text className="mt-2 text-center text-sm font-medium text-slate-700">
						Sin conexión. La lista de alumnos de esta materia todavía no se descargó.
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
						Materia sin alumnos registrados
					</Text>
				</View>
			) : (
				<ScrollView className="flex-1 px-4 py-3">
					{students.map((student, index) => {
						const currentStatus = attendanceMap[student.id] || 'present';
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
														color: isActive ? colors.activeText : '#475569',
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
			{students.length > 0 && (
				<View className="border-t border-slate-200 bg-white px-5 py-4 shadow-lg">
					<TouchableOpacity
						onPress={handleSave}
						disabled={isSaving}
						className="items-center justify-center rounded-xl bg-indigo-600 py-3.5 shadow-sm active:bg-indigo-700 disabled:opacity-50"
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
