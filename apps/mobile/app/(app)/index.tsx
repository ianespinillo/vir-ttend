import { onlineManager, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
	BookOpen,
	Calendar,
	CheckCircle,
	ChevronRight,
	Clock,
	CloudOff,
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
import { attendanceQueries } from '../../src/features/attendance/queries';
import {
	formatSlotRanges,
	getTodaysSubjects,
} from '../../src/features/attendance/schedule';
import { usePreceptorCourses } from '../../src/features/attendance/use-preceptor-courses';
import { preloadRoleOf } from '../../src/features/offline/preload';
import { usePreload } from '../../src/features/offline/preload-provider';
import { SyncIndicator } from '../../src/features/offline/sync-indicator';
import { useIsOnline } from '../../src/features/offline/use-is-online';
import { toLocalDateString, weekdayOf } from '../../src/lib/date';

export default function HomeScreen() {
	const { user } = useAuth();
	const router = useRouter();
	const online = useIsOnline();
	const { preloadNow } = usePreload();
	const [refreshing, setRefreshing] = useState(false);

	const isPreceptor = preloadRoleOf(user?.role) === 'preceptor';
	const isTeacher = preloadRoleOf(user?.role) === 'teacher';

	const todayStr = toLocalDateString();
	const weekday = weekdayOf();

	// Preceptors: dashboard (fallback: active year + assigned courses).
	const preceptor = usePreceptorCourses(todayStr, isPreceptor);

	// Teachers: subjects with their weekly slots, filtered by today's weekday.
	const subjectsQuery = useQuery({
		...attendanceQueries.mySubjects(),
		enabled: isTeacher,
	});
	const subjects = subjectsQuery.data;
	const todaysSubjects = useMemo(
		() => getTodaysSubjects(subjects ?? [], weekday),
		[subjects, weekday],
	);

	const courses = preceptor.courses;
	const isLoading = isPreceptor ? preceptor.isLoading : subjectsQuery.isLoading;
	const hasContent = isPreceptor
		? courses.length > 0
		: todaysSubjects.length > 0;
	const hasAnyCachedData = isPreceptor
		? courses.length > 0
		: (subjects?.length ?? 0) > 0;

	const onRefresh = async () => {
		// While offline a refetch would stay paused and the spinner would hang.
		if (!onlineManager.isOnline()) return;
		setRefreshing(true);
		try {
			await preloadNow();
			if (isPreceptor) {
				await preceptor.refetch();
			} else {
				await subjectsQuery.refetch();
			}
		} finally {
			setRefreshing(false);
		}
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
			<View className="mb-4 rounded-2xl bg-indigo-600 p-5 shadow-sm">
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
					{isPreceptor
						? 'Panel de Preceptoría • Control de Asistencia Diaria'
						: 'Panel Docente • Asistencia por Materia'}
				</Text>
			</View>

			{/* Offline / last-synced indicator */}
			<SyncIndicator />

			{/* Quick Stats Summary */}
			{isPreceptor ? (
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
			) : (
				<View className="mb-6 flex-row space-x-3">
					<View className="mr-3 flex-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
						<View className="h-9 w-9 items-center justify-center rounded-xl bg-indigo-50">
							<Clock size={18} color="#4F46E5" />
						</View>
						<Text className="mt-2 text-2xl font-bold text-slate-800">
							{todaysSubjects.length}
						</Text>
						<Text className="text-xs font-medium text-slate-500">Materias hoy</Text>
					</View>
					<View className="flex-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
						<View className="h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
							<BookOpen size={18} color="#059669" />
						</View>
						<Text className="mt-2 text-2xl font-bold text-slate-800">
							{subjects?.length ?? 0}
						</Text>
						<Text className="text-xs font-medium text-slate-500">
							Materias a cargo
						</Text>
					</View>
				</View>
			)}

			{/* Section Title */}
			<View className="mb-3 flex-row items-center justify-between">
				<Text className="text-lg font-bold text-slate-900">
					{isPreceptor ? 'Cursos Asignados' : 'Clases de Hoy'}
				</Text>
				<Text className="text-xs font-semibold text-slate-500">
					Toca para pasar lista
				</Text>
			</View>

			{isLoading ? (
				<View className="items-center justify-center py-12">
					<ActivityIndicator size="large" color="#4F46E5" />
					<Text className="mt-3 text-sm text-slate-500">
						Cargando cursos y asistencia...
					</Text>
				</View>
			) : !hasContent && !online && !hasAnyCachedData ? (
				<View className="items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8">
					<CloudOff size={32} color="#94A3B8" />
					<Text className="mt-3 text-base font-semibold text-slate-700">
						Sin conexión
					</Text>
					<Text className="mt-1 text-center text-xs text-slate-400">
						Todavía no hay datos guardados. Conectate a internet para descargar tus
						cursos y alumnos.
					</Text>
				</View>
			) : !hasContent ? (
				<View className="items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8">
					<Users size={32} color="#94A3B8" />
					<Text className="mt-3 text-base font-semibold text-slate-700">
						{isPreceptor ? 'No hay cursos disponibles' : 'Hoy no tenés clases'}
					</Text>
					<Text className="mt-1 text-center text-xs text-slate-400">
						{isPreceptor
							? 'No tenés cursos asignados para este ciclo lectivo.'
							: 'No hay materias con clase programada para el día de hoy.'}
					</Text>
				</View>
			) : isPreceptor ? (
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
			) : (
				<View className="space-y-3 pb-8">
					{todaysSubjects.map(({ subject, slots }) => (
						<TouchableOpacity
							key={subject.subjectId}
							onPress={() =>
								router.push({
									pathname: '/(app)/attendance/subject/[subjectId]',
									params: {
										subjectId: subject.subjectId,
										name: subject.name,
										courseName: subject.courseName,
									},
								})
							}
							className="mb-3 flex-row items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm active:border-indigo-400 active:bg-indigo-50/20"
						>
							<View className="flex-1 pr-3">
								<Text className="text-base font-bold text-slate-800">
									{subject.name}
								</Text>
								<Text className="mt-0.5 text-xs font-medium text-slate-500">
									{subject.courseName}
								</Text>
								<View className="mt-1.5 flex-row items-center">
									<Clock size={12} color="#64748B" />
									<Text className="ml-1 text-xs text-slate-500">
										{formatSlotRanges(slots)}
									</Text>
								</View>
							</View>

							<View className="flex-row items-center">
								<View className="rounded-lg bg-indigo-50 px-2.5 py-1.5">
									<Text className="text-xs font-semibold text-indigo-700">
										Pasar lista
									</Text>
								</View>
								<ChevronRight size={18} color="#94A3B8" className="ml-1" />
							</View>
						</TouchableOpacity>
					))}
				</View>
			)}
		</ScrollView>
	);
}
