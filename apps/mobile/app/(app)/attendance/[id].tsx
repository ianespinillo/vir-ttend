import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
	AlertCircle,
	ArrowLeft,
	Calendar,
	Check,
	CheckCheck,
	Clock,
	Users,
	X,
} from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../../src/services/api';

type AttendanceStatus = 'present' | 'absent' | 'late';

interface StudentItem {
	id: string;
	firstName: string;
	lastName: string;
	documentNumber?: string;
}

export default function AttendanceSheetScreen() {
	const params = useLocalSearchParams();
	const router = useRouter();

	const courseId = typeof params.id === 'string' ? params.id : '';
	const courseName = typeof params.name === 'string' ? params.name : 'Curso';

	// Today in YYYY-MM-DD format
	const todayStr = useMemo(() => {
		const d = new Date();
		const year = d.getFullYear();
		const month = String(d.getMonth() + 1).padStart(2, '0');
		const day = String(d.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}, []);

	// State for attendance map: studentId -> status
	const [attendanceMap, setAttendanceMap] = useState<
		Record<string, AttendanceStatus>
	>({});
	const [isSaving, setIsSaving] = useState(false);

	// Fetch students of the course
	const {
		data: studentsData,
		isLoading: isLoadingStudents,
		error: studentsError,
	} = useQuery({
		queryKey: ['students-course', courseId],
		queryFn: async () => {
			const res = await api.get('/students', {
				params: { courseId, limit: 100 },
			});
			const payload = res.data?.data || res.data;
			return Array.isArray(payload) ? payload : payload?.items || [];
		},
		enabled: !!courseId,
	});

	// Fetch today's existing attendance if registered
	const { data: existingAttendance } = useQuery({
		queryKey: ['attendance-course', courseId, todayStr],
		queryFn: async () => {
			try {
				const res = await api.get('/attendance/daily', {
					params: { courseId, date: todayStr },
				});
				return res.data?.data || res.data || [];
			} catch {
				return [];
			}
		},
		enabled: !!courseId,
	});

	const students: StudentItem[] = studentsData || [];

	// Populate attendance state from existing attendance or default
	useEffect(() => {
		if (!students.length) return;

		const map: Record<string, AttendanceStatus> = {};
		if (Array.isArray(existingAttendance) && existingAttendance.length > 0) {
			for (const record of existingAttendance) {
				if (record.studentId && record.status) {
					map[record.studentId] = record.status;
				}
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
		setAttendanceMap((prev) => ({
			...prev,
			[studentId]: status,
		}));
	};

	const markAllPresent = () => {
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
		setIsSaving(true);
		try {
			const records = Object.entries(attendanceMap).map(([studentId, status]) => ({
				studentId,
				status,
			}));

			await api.post('/attendance/daily', {
				courseId,
				date: todayStr,
				records,
			});

			Alert.alert(
				'¡Asistencia Guardada!',
				`Se registraron ${counts.present} presentes, ${counts.absent} ausentes y ${counts.late} tardanzas.`,
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
				'Error al registrar asistencia';
			Alert.alert('Error', typeof msg === 'string' ? msg : 'Error inesperado');
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
						<View className="mt-1 flex-row items-center space-x-2">
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
			) : studentsError ? (
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
									{/* Present button */}
									<TouchableOpacity
										onPress={() => handleStatusChange(student.id, 'present')}
										className={`h-9 w-9 items-center justify-center rounded-md ${
											currentStatus === 'present'
												? 'bg-emerald-600 shadow-sm'
												: 'bg-transparent'
										}`}
									>
										<Text
											className={`text-sm font-bold ${
												currentStatus === 'present' ? 'text-white' : 'text-slate-600'
											}`}
										>
											P
										</Text>
									</TouchableOpacity>

									{/* Absent button */}
									<TouchableOpacity
										onPress={() => handleStatusChange(student.id, 'absent')}
										className={`ml-1 h-9 w-9 items-center justify-center rounded-md ${
											currentStatus === 'absent'
												? 'bg-red-600 shadow-sm'
												: 'bg-transparent'
										}`}
									>
										<Text
											className={`text-sm font-bold ${
												currentStatus === 'absent' ? 'text-white' : 'text-slate-600'
											}`}
										>
											A
										</Text>
									</TouchableOpacity>

									{/* Late button */}
									<TouchableOpacity
										onPress={() => handleStatusChange(student.id, 'late')}
										className={`ml-1 h-9 w-9 items-center justify-center rounded-md ${
											currentStatus === 'late'
												? 'bg-amber-500 shadow-sm'
												: 'bg-transparent'
										}`}
									>
										<Text
											className={`text-sm font-bold ${
												currentStatus === 'late' ? 'text-white' : 'text-slate-600'
											}`}
										>
											T
										</Text>
									</TouchableOpacity>
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
