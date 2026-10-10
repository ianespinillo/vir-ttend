import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
	AlertCircle,
	BookOpen,
	Calendar,
	CheckCircle,
	ChevronRight,
	Clock,
	Users,
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
	ActivityIndicator,
	RefreshControl,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import { useAuth } from '../../src/context/auth-context';
import { api } from '../../src/services/api';

interface CourseSnapshotItem {
	courseId: string;
	courseName: string;
	level?: string;
	shift?: string;
	totalStudents?: number;
	present?: number;
	absent?: number;
	late?: number;
	notRecorded?: number;
	attendancePercent?: number;
}

export default function HomeScreen() {
	const { user } = useAuth();
	const router = useRouter();
	const [refreshing, setRefreshing] = useState(false);

	const isPreceptor = user?.role === 'preceptor' || user?.role === 'admin';

	const todayStr = useMemo(() => {
		const d = new Date();
		const year = d.getFullYear();
		const month = String(d.getMonth() + 1).padStart(2, '0');
		const day = String(d.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}, []);

	// Query for preceptors: /dashboard?date=YYYY-MM-DD
	const preceptorQuery = useQuery({
		queryKey: ['preceptor-dashboard', todayStr],
		queryFn: async () => {
			const res = await api.get('/dashboard', {
				params: { date: todayStr },
			});
			const payload = res.data?.data || res.data;
			return payload?.courses || [];
		},
		enabled: isPreceptor,
	});

	// Fallback/standard courses query: /courses
	const coursesQuery = useQuery({
		queryKey: ['mobile-courses'],
		queryFn: async () => {
			const res = await api.get('/courses');
			const payload = res.data?.data || res.data;
			return Array.isArray(payload) ? payload : payload?.items || [];
		},
		enabled:
			!isPreceptor || (preceptorQuery.isError && !preceptorQuery.isLoading),
	});

	const isLoading = isPreceptor
		? preceptorQuery.isLoading
		: coursesQuery.isLoading;

	const courses: CourseSnapshotItem[] = useMemo(() => {
		if (isPreceptor && preceptorQuery.data && preceptorQuery.data.length > 0) {
			return preceptorQuery.data;
		}
		const genericCourses = coursesQuery.data || [];
		return genericCourses.map(
			(c: { id: string; name: string; shift?: string; level?: string }) => ({
				courseId: c.id,
				courseName: c.name,
				shift: c.shift,
				level: c.level,
			}),
		);
	}, [isPreceptor, preceptorQuery.data, coursesQuery.data]);

	const onRefresh = async () => {
		setRefreshing(true);
		if (isPreceptor) {
			await preceptorQuery.refetch();
		} else {
			await coursesQuery.refetch();
		}
		setRefreshing(false);
	};

	const todayFormatted = new Intl.DateTimeFormat('es-AR', {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
	}).format(new Date());

	// Aggregate metrics
	const totalStudentsAcrossCourses = useMemo(() => {
		return courses.reduce((acc, c) => acc + (c.totalStudents || 0), 0);
	}, [courses]);

	return (
		<ScrollView
			className="flex-1 bg-slate-50 px-5 py-4"
			refreshControl={
				<RefreshControl
					refreshing={refreshing}
					onRefresh={onRefresh}
					tintColor="#4F46E5"
				/>
			}
		>
			{/* Greeting & Date Header */}
			<View className="mb-6 rounded-2xl bg-indigo-600 p-5 shadow-sm">
				<View className="flex-row items-center space-x-2">
					<Calendar size={16} color="#E0E7FF" />
					<Text className="ml-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-100">
						{todayFormatted}
					</Text>
				</View>
				<Text className="mt-2 text-2xl font-bold text-white">
					¡Hola, {user?.firstName || 'Docente'}!
				</Text>
				<Text className="mt-1 text-sm text-indigo-100">
					{user?.role === 'preceptor'
						? 'Panel de Preceptoría • Control de Asistencia Diaria'
						: 'Panel Docente • Asistencia de Cursos'}
				</Text>
			</View>

			{/* Quick Stats Summary */}
			<View className="mb-6 flex-row space-x-3">
				<View className="mr-3 flex-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
					<View className="h-9 w-9 items-center justify-center rounded-xl bg-indigo-50">
						<BookOpen size={18} color="#4F46E5" />
					</View>
					<Text className="mt-2 text-2xl font-bold text-slate-800">
						{courses.length}
					</Text>
					<Text className="text-xs font-medium text-slate-500">Cursos a cargo</Text>
				</View>
				<View className="flex-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
					<View className="h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
						<CheckCircle size={18} color="#059669" />
					</View>
					<Text className="mt-2 text-2xl font-bold text-slate-800">
						{totalStudentsAcrossCourses > 0 ? totalStudentsAcrossCourses : 'Alumnos'}
					</Text>
					<Text className="text-xs font-medium text-slate-500">
						{totalStudentsAcrossCourses > 0 ? 'Total de matrícula' : 'Toma rápida'}
					</Text>
				</View>
			</View>

			{/* Course Section Title */}
			<View className="mb-3 flex-row items-center justify-between">
				<Text className="text-lg font-bold text-slate-900">
					{isPreceptor ? 'Cursos Asignados' : 'Cursos y Divisiones'}
				</Text>
				<Text className="text-xs font-semibold text-slate-500">
					Toca para pasar lista
				</Text>
			</View>

			{/* Course List */}
			{isLoading ? (
				<View className="items-center justify-center py-12">
					<ActivityIndicator size="large" color="#4F46E5" />
					<Text className="mt-3 text-sm text-slate-500">
						Cargando cursos y asistencia...
					</Text>
				</View>
			) : courses.length === 0 ? (
				<View className="items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8">
					<Users size={32} color="#94A3B8" />
					<Text className="mt-3 text-base font-semibold text-slate-700">
						No hay cursos disponibles
					</Text>
					<Text className="mt-1 text-center text-xs text-slate-400">
						No tenés cursos asignados para este ciclo lectivo.
					</Text>
				</View>
			) : (
				<View className="space-y-3 pb-8">
					{courses.map((course) => {
						const hasAttendanceTaken =
							course.totalStudents !== undefined &&
							course.notRecorded !== undefined &&
							course.notRecorded < course.totalStudents;

						return (
							<TouchableOpacity
								key={course.courseId}
								onPress={() =>
									router.push({
										pathname: '/(app)/attendance/[id]',
										params: { id: course.courseId, name: course.courseName },
									})
								}
								className="mb-3 flex-row items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm active:border-indigo-400 active:bg-indigo-50/20"
							>
								<View className="flex-1 pr-3">
									<View className="flex-row items-center space-x-2">
										<Text className="text-base font-bold text-slate-800">
											{course.courseName}
										</Text>
									</View>

									<View className="mt-1.5 flex-row items-center space-x-2">
										{course.totalStudents !== undefined && (
											<Text className="text-xs text-slate-500 font-medium">
												{course.totalStudents} estudiantes •{' '}
											</Text>
										)}
										<View className="flex-row items-center">
											<Clock size={12} color="#64748B" />
											<Text className="ml-1 text-xs text-slate-500 capitalize">
												{course.shift || 'Turno mañana'}
											</Text>
										</View>
									</View>

									{/* Status badge for preceptors */}
									{course.totalStudents !== undefined && (
										<View className="mt-2 flex-row items-center">
											{hasAttendanceTaken ? (
												<View className="rounded-md bg-emerald-50 px-2 py-0.5 border border-emerald-200">
													<Text className="text-[11px] font-semibold text-emerald-700">
														✓ {course.present || 0}P • {course.absent || 0}A •{' '}
														{course.late || 0}T ({course.attendancePercent || 0}
														%)
													</Text>
												</View>
											) : (
												<View className="rounded-md bg-slate-100 px-2 py-0.5">
													<Text className="text-[11px] font-semibold text-slate-600">
														Pendiente de toma
													</Text>
												</View>
											)}
										</View>
									)}
								</View>

								<View className="flex-row items-center">
									<View className="rounded-lg bg-indigo-50 px-2.5 py-1.5">
										<Text className="text-xs font-semibold text-indigo-700">
											{hasAttendanceTaken ? 'Editar' : 'Pasar lista'}
										</Text>
									</View>
									<ChevronRight size={18} color="#94A3B8" className="ml-1" />
								</View>
							</TouchableOpacity>
						);
					})}
				</View>
			)}
		</ScrollView>
	);
}
