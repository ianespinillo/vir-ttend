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
	Wrench,
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
import { deriveTakenState } from '../../src/features/attendance/taken';
import { TodayStatusBadges } from '../../src/features/attendance/today-status-badges';
import { usePreceptorCourses } from '../../src/features/attendance/use-preceptor-courses';
import {
	useCommissionsTodayRecords,
	useCoursesTodayRecords,
	useSubjectsTodayRecords,
} from '../../src/features/attendance/use-today-records';
import { formatCommissionLabel } from '../../src/features/attendance/workshop';
import { useBrand } from '../../src/features/branding/brand-context';
import { FailedSyncBanner } from '../../src/features/offline/failed-sync-banner';
import { preloadRoleOf } from '../../src/features/offline/preload';
import { usePreload } from '../../src/features/offline/preload-provider';
import { SyncIndicator } from '../../src/features/offline/sync-indicator';
import { useIsOnline } from '../../src/features/offline/use-is-online';
import { useOutbox } from '../../src/features/offline/use-outbox';
import { useThemeColors } from '../../src/features/theme/use-theme-colors';
import { toLocalDateString, weekdayOf } from '../../src/lib/date';

export default function HomeScreen() {
	const { tokens } = useBrand();
	const theme = useThemeColors();
	const { user } = useAuth();
	const router = useRouter();
	const online = useIsOnline();
	const { preloadNow } = usePreload();
	const { flush, getItemForCourse, getItemForSubject, getItemForCommission } =
		useOutbox();
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

	// Workshop commissions (technical schools); empty for everyone else.
	const commissionsQuery = useQuery({
		...attendanceQueries.myWorkshopCommissions(todayStr),
		enabled: isPreceptor,
	});
	const commissions = commissionsQuery.data ?? [];
	const commissionIds = useMemo(
		() => commissions.map((c) => c.commissionId),
		[commissions],
	);
	const commissionRecords = useCommissionsTodayRecords(
		commissionIds,
		todayStr,
		isPreceptor,
	);

	const courses = preceptor.courses;

	// "Taken today" comes from the day's own records (cache-first, works
	// offline); the dashboard snapshots are year-to-date and cannot tell.
	const courseIds = useMemo(() => courses.map((c) => c.courseId), [courses]);
	const subjectIds = useMemo(
		() => todaysSubjects.map(({ subject }) => subject.subjectId),
		[todaysSubjects],
	);
	const courseRecords = useCoursesTodayRecords(courseIds, todayStr, isPreceptor);
	const subjectRecords = useSubjectsTodayRecords(
		subjectIds,
		todayStr,
		isTeacher,
	);
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
			await Promise.all([preloadNow(), flush({ force: true })]);
			if (isPreceptor) {
				await Promise.all([preceptor.refetch(), commissionsQuery.refetch()]);
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
			className="flex-1 bg-background px-5 py-4"
			refreshControl={
				<RefreshControl
					refreshing={refreshing}
					onRefresh={onRefresh}
					tintColor={theme.primaryInk}
				/>
			}
		>
			{/* Greeting & Date Header */}
			<View className="mb-4 rounded-2xl bg-primary p-5 shadow-sm">
				<View className="flex-row items-center space-x-2">
					<Calendar size={16} color={tokens.scale[100]} />
					<Text className="ml-1.5 text-xs font-semibold uppercase tracking-wider text-primary-100">
						{todayFormatted}
					</Text>
				</View>
				<Text className="mt-2 text-2xl font-bold text-white">
					¡Hola, {user?.firstName || 'Docente'}!
				</Text>
				<Text className="mt-1 text-sm text-primary-100">
					{isPreceptor
						? 'Panel de Preceptoría • Control de Asistencia Diaria'
						: 'Panel Docente • Asistencia por Materia'}
				</Text>
			</View>

			{/* Offline / last-synced indicator */}
			<SyncIndicator />
			<FailedSyncBanner />

			{/* Quick Stats Summary */}
			{isPreceptor ? (
				<View className="mb-6 flex-row space-x-3">
					<View className="mr-3 flex-1 rounded-2xl border border-border bg-card p-4 shadow-sm">
						<View className="h-9 w-9 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-ink/15">
							<BookOpen size={18} color={theme.primaryInk} />
						</View>
						<Text className="mt-2 text-2xl font-bold text-neutral-800">
							{courses.length}
						</Text>
						<Text className="text-xs font-medium text-muted-foreground">
							Cursos a cargo
						</Text>
					</View>
					<View className="flex-1 rounded-2xl border border-border bg-card p-4 shadow-sm">
						<View className="h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/15">
							<CheckCircle size={18} color={theme.status.success.icon} />
						</View>
						<Text className="mt-2 text-2xl font-bold text-neutral-800">
							{totalStudentsAcrossCourses > 0 ? totalStudentsAcrossCourses : 'Alumnos'}
						</Text>
						<Text className="text-xs font-medium text-muted-foreground">
							{totalStudentsAcrossCourses > 0 ? 'Total de matrícula' : 'Toma rápida'}
						</Text>
					</View>
				</View>
			) : (
				<View className="mb-6 flex-row space-x-3">
					<View className="mr-3 flex-1 rounded-2xl border border-border bg-card p-4 shadow-sm">
						<View className="h-9 w-9 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-ink/15">
							<Clock size={18} color={theme.primaryInk} />
						</View>
						<Text className="mt-2 text-2xl font-bold text-neutral-800">
							{todaysSubjects.length}
						</Text>
						<Text className="text-xs font-medium text-muted-foreground">
							Materias hoy
						</Text>
					</View>
					<View className="flex-1 rounded-2xl border border-border bg-card p-4 shadow-sm">
						<View className="h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/15">
							<BookOpen size={18} color={theme.status.success.icon} />
						</View>
						<Text className="mt-2 text-2xl font-bold text-neutral-800">
							{subjects?.length ?? 0}
						</Text>
						<Text className="text-xs font-medium text-muted-foreground">
							Materias a cargo
						</Text>
					</View>
				</View>
			)}

			{/* Section Title */}
			<View className="mb-3 flex-row items-center justify-between">
				<Text className="text-lg font-bold text-foreground">
					{isPreceptor ? 'Cursos Asignados' : 'Clases de Hoy'}
				</Text>
				<Text className="text-xs font-semibold text-muted-foreground">
					Toca para pasar lista
				</Text>
			</View>

			{isLoading ? (
				<View className="items-center justify-center py-12">
					<ActivityIndicator size="large" color={theme.primaryInk} />
					<Text className="mt-3 text-sm text-muted-foreground">
						Cargando cursos y asistencia...
					</Text>
				</View>
			) : !hasContent && !online && !hasAnyCachedData ? (
				<View className="items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-card p-8">
					<CloudOff size={32} color={theme.neutral400} />
					<Text className="mt-3 text-base font-semibold text-neutral-700">
						Sin conexión
					</Text>
					<Text className="mt-1 text-center text-xs text-neutral-400">
						Todavía no hay datos guardados. Conectate a internet para descargar tus
						cursos y alumnos.
					</Text>
				</View>
			) : !hasContent ? (
				<View className="items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-card p-8">
					<Users size={32} color={theme.neutral400} />
					<Text className="mt-3 text-base font-semibold text-neutral-700">
						{isPreceptor ? 'No hay cursos disponibles' : 'Hoy no tenés clases'}
					</Text>
					<Text className="mt-1 text-center text-xs text-neutral-400">
						{isPreceptor
							? 'No tenés cursos asignados para este ciclo lectivo.'
							: 'No hay materias con clase programada para el día de hoy.'}
					</Text>
				</View>
			) : isPreceptor ? (
				<View className="space-y-3 pb-8">
					{courses.map((course) => {
						const outboxItem = getItemForCourse(course.courseId, todayStr);
						const taken = deriveTakenState({
							records: courseRecords.get(course.courseId),
							outboxItem,
						});
						const hasAttendanceTaken = taken.kind === 'taken';

						return (
							<TouchableOpacity
								key={course.courseId}
								onPress={() =>
									router.push({
										pathname: '/(app)/attendance/[id]',
										params: { id: course.courseId, name: course.courseName },
									})
								}
								className="mb-3 flex-row items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-sm active:border-primary-400 active:bg-primary-50/20 dark:active:bg-primary-ink/10"
							>
								<View className="flex-1 pr-3">
									<View className="flex-row items-center space-x-2">
										<Text className="text-base font-bold text-neutral-800">
											{course.courseName}
										</Text>
									</View>

									<View className="mt-1.5 flex-row items-center space-x-2">
										{course.totalStudents !== undefined && (
											<Text className="text-xs text-muted-foreground font-medium">
												{course.totalStudents} estudiantes •{' '}
											</Text>
										)}
										<View className="flex-row items-center">
											<Clock size={12} color={theme.mutedForeground} />
											<Text className="ml-1 text-xs text-muted-foreground capitalize">
												{course.shift || 'Turno mañana'}
											</Text>
										</View>
									</View>

									{/* Today's state and attendance rate (dashboard and fallback list) */}
									<TodayStatusBadges taken={taken} outboxItem={outboxItem} />
								</View>

								<View className="flex-row items-center">
									<View className="rounded-lg bg-primary-50 dark:bg-primary-ink/15 px-2.5 py-1.5">
										<Text className="text-xs font-semibold text-primary-700 dark:text-primary-ink">
											{outboxItem || hasAttendanceTaken ? 'Editar' : 'Pasar lista'}
										</Text>
									</View>
									<ChevronRight size={18} color={theme.neutral400} className="ml-1" />
								</View>
							</TouchableOpacity>
						);
					})}
				</View>
			) : (
				<View className="space-y-3 pb-8">
					{todaysSubjects.map(({ subject, slots }) => {
						const outboxItem = getItemForSubject(subject.subjectId, todayStr);
						const taken = deriveTakenState({
							records: subjectRecords.get(subject.subjectId),
							outboxItem,
						});

						return (
							<TouchableOpacity
								key={subject.subjectId}
								onPress={() =>
									router.push({
										pathname: '/(app)/attendance/subject/[subjectId]',
										params: {
											subjectId: subject.subjectId,
											name: subject.name,
											courseName: subject.courseName,
											courseId: subject.courseId,
										},
									})
								}
								className="mb-3 flex-row items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-sm active:border-primary-400 active:bg-primary-50/20 dark:active:bg-primary-ink/10"
							>
								<View className="flex-1 pr-3">
									<Text className="text-base font-bold text-neutral-800">
										{subject.name}
									</Text>
									<Text className="mt-0.5 text-xs font-medium text-muted-foreground">
										{subject.courseName}
									</Text>
									<View className="mt-1.5 flex-row items-center">
										<Clock size={12} color={theme.mutedForeground} />
										<Text className="ml-1 text-xs text-muted-foreground">
											{formatSlotRanges(slots)}
										</Text>
									</View>

									{/* Today's state for teachers */}
									<TodayStatusBadges taken={taken} outboxItem={outboxItem} />
								</View>

								<View className="flex-row items-center">
									<View className="rounded-lg bg-primary-50 dark:bg-primary-ink/15 px-2.5 py-1.5">
										<Text className="text-xs font-semibold text-primary-700 dark:text-primary-ink">
											{outboxItem || taken.kind === 'taken' ? 'Editar' : 'Pasar lista'}
										</Text>
									</View>
									<ChevronRight size={18} color={theme.neutral400} className="ml-1" />
								</View>
							</TouchableOpacity>
						);
					})}
				</View>
			)}

			{/* Workshop commissions (taller) */}
			{isPreceptor && commissions.length > 0 ? (
				<View className="pb-8">
					<View className="mb-3 flex-row items-center">
						<Wrench size={16} color={theme.neutral600} />
						<Text className="ml-2 text-lg font-bold text-foreground">Taller</Text>
					</View>
					{commissions.map((commission) => {
						const label = formatCommissionLabel(commission);
						const outboxItem = getItemForCommission(
							commission.commissionId,
							todayStr,
						);
						const taken = deriveTakenState({
							records: commissionRecords.get(commission.commissionId),
							outboxItem,
						});

						return (
							<TouchableOpacity
								key={commission.commissionId}
								onPress={() =>
									router.push({
										pathname: '/(app)/attendance/workshop/[commissionId]',
										params: { commissionId: commission.commissionId, name: label },
									})
								}
								className="mb-3 flex-row items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-sm active:border-primary-400 active:bg-primary-50/20 dark:active:bg-primary-ink/10"
							>
								<View className="flex-1 pr-3">
									<Text className="text-base font-bold text-neutral-800">{label}</Text>
									{!commission.hasWorkshopToday ? (
										<Text className="mt-1 text-xs text-muted-foreground">
											Hoy no hay taller
										</Text>
									) : null}
									<TodayStatusBadges taken={taken} outboxItem={outboxItem} />
								</View>

								<View className="flex-row items-center">
									<View className="rounded-lg bg-primary-50 dark:bg-primary-ink/15 px-2.5 py-1.5">
										<Text className="text-xs font-semibold text-primary-700 dark:text-primary-ink">
											{outboxItem || taken.kind === 'taken' ? 'Editar' : 'Pasar lista'}
										</Text>
									</View>
									<ChevronRight size={18} color={theme.neutral400} className="ml-1" />
								</View>
							</TouchableOpacity>
						);
					})}
				</View>
			) : null}
		</ScrollView>
	);
}
