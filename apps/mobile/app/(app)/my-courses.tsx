import { useQuery } from '@tanstack/react-query';
import {
	BookOpen,
	ChevronDown,
	ChevronRight,
	Users,
	Wrench,
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
	ActivityIndicator,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import { useAuth } from '../../src/context/auth-context';
import {
	groupSubjectsByCourse,
	recordStudentNames,
	studentNames,
} from '../../src/features/attendance/my-courses';
import { attendanceQueries } from '../../src/features/attendance/queries';
import { formatSlotRanges } from '../../src/features/attendance/schedule';
import { usePreceptorCourses } from '../../src/features/attendance/use-preceptor-courses';
import { formatCommissionLabel } from '../../src/features/attendance/workshop';
import { preloadRoleOf } from '../../src/features/offline/preload';
import { useThemeColors } from '../../src/features/theme/use-theme-colors';
import { toLocalDateString } from '../../src/lib/date';

/** Courses (and workshop commissions) of the preceptor, or subjects of the teacher, with their rosters. */
export default function MyCoursesScreen() {
	const { user } = useAuth();
	const isPreceptor = preloadRoleOf(user?.role) === 'preceptor';
	const isTeacher = preloadRoleOf(user?.role) === 'teacher';
	const todayStr = toLocalDateString();

	return (
		<ScrollView className="flex-1 bg-background px-5 py-4">
			{isPreceptor ? <PreceptorCourses date={todayStr} /> : null}
			{isTeacher ? <TeacherSubjects /> : null}
			<View className="h-8" />
		</ScrollView>
	);
}

function PreceptorCourses({ date }: { date: string }) {
	const theme = useThemeColors();
	const { courses, isLoading } = usePreceptorCourses(date, true);
	const commissionsQuery = useQuery(
		attendanceQueries.myWorkshopCommissions(date),
	);
	const commissions = commissionsQuery.data ?? [];

	if (isLoading) return <Loading />;

	return (
		<>
			<SectionTitle
				icon={<BookOpen size={16} color={theme.neutral600} />}
				title="Cursos"
			/>
			{courses.length === 0 ? (
				<EmptyText text="No tenés cursos asignados para este ciclo lectivo." />
			) : (
				courses.map((course) => (
					<ExpandableCard
						key={course.courseId}
						title={course.courseName}
						subtitle={
							course.totalStudents !== undefined
								? `${course.totalStudents} estudiantes`
								: undefined
						}
					>
						<CourseRoster courseId={course.courseId} />
					</ExpandableCard>
				))
			)}

			{commissions.length > 0 ? (
				<>
					<SectionTitle
						icon={<Wrench size={16} color={theme.neutral600} />}
						title="Taller"
					/>
					{commissions.map((commission) => (
						<ExpandableCard
							key={commission.commissionId}
							title={formatCommissionLabel(commission)}
						>
							<CommissionRoster commissionId={commission.commissionId} date={date} />
						</ExpandableCard>
					))}
				</>
			) : null}
		</>
	);
}

function TeacherSubjects() {
	const theme = useThemeColors();
	const subjectsQuery = useQuery(attendanceQueries.mySubjects());
	const groups = useMemo(
		() => groupSubjectsByCourse(subjectsQuery.data ?? []),
		[subjectsQuery.data],
	);

	if (subjectsQuery.isLoading) return <Loading />;
	if (groups.length === 0) {
		return <EmptyText text="No tenés materias asignadas." />;
	}

	return (
		<>
			{groups.map((group) => (
				<View key={group.courseId}>
					<SectionTitle
						icon={<BookOpen size={16} color={theme.neutral600} />}
						title={group.courseName}
					/>
					{group.subjects.map((subject) => (
						<ExpandableCard
							key={subject.subjectId}
							title={subject.name}
							subtitle={
								subject.slots.length > 0 ? formatSlotRanges(subject.slots) : undefined
							}
						>
							<SubjectRoster subjectId={subject.subjectId} />
						</ExpandableCard>
					))}
				</View>
			))}
		</>
	);
}

function CourseRoster({ courseId }: { courseId: string }) {
	const query = useQuery(attendanceQueries.courseStudents(courseId));
	return (
		<Roster
			names={query.data ? studentNames(query.data) : undefined}
			isLoading={query.isLoading}
		/>
	);
}

function CommissionRoster({
	commissionId,
	date,
}: { commissionId: string; date: string }) {
	const query = useQuery(
		attendanceQueries.workshopAttendance(commissionId, date),
	);
	return (
		<Roster
			names={query.data ? recordStudentNames(query.data.records) : undefined}
			isLoading={query.isLoading}
		/>
	);
}

/** Undated roster: every commission the subject targets (same entry the preload fills). */
function SubjectRoster({ subjectId }: { subjectId: string }) {
	const query = useQuery(attendanceQueries.subjectStudents(subjectId));
	return (
		<Roster
			names={query.data ? studentNames(query.data) : undefined}
			isLoading={query.isLoading}
		/>
	);
}

function Roster({
	names,
	isLoading,
}: { names?: string[]; isLoading: boolean }) {
	const theme = useThemeColors();
	if (isLoading) {
		return (
			<ActivityIndicator size="small" color={theme.primaryInk} className="py-3" />
		);
	}
	if (!names) {
		return (
			<Text className="py-2 text-xs text-muted-foreground">
				No se pudo cargar la lista de alumnos.
			</Text>
		);
	}
	if (names.length === 0) {
		return (
			<Text className="py-2 text-xs text-muted-foreground">Sin alumnos.</Text>
		);
	}
	return (
		<View>
			{names.map((name, index) => (
				<Text
					// Names can repeat; the position keeps keys unique.
					key={`${index}-${name}`}
					className="border-t border-border py-2 text-sm text-neutral-700"
				>
					{index + 1}. {name}
				</Text>
			))}
		</View>
	);
}

function ExpandableCard({
	title,
	subtitle,
	children,
}: {
	title: string;
	subtitle?: string;
	children: React.ReactNode;
}) {
	const theme = useThemeColors();
	const [open, setOpen] = useState(false);
	const Chevron = open ? ChevronDown : ChevronRight;

	return (
		<View className="mb-3 rounded-2xl border border-border bg-card shadow-sm">
			<TouchableOpacity
				onPress={() => setOpen((value) => !value)}
				className="flex-row items-center justify-between p-4"
			>
				<View className="flex-1 pr-3">
					<Text className="text-base font-bold text-neutral-800">{title}</Text>
					{subtitle ? (
						<Text className="mt-0.5 text-xs text-muted-foreground">{subtitle}</Text>
					) : null}
				</View>
				<Chevron size={18} color={theme.neutral400} />
			</TouchableOpacity>
			{open ? <View className="px-4 pb-2">{children}</View> : null}
		</View>
	);
}

function SectionTitle({
	icon,
	title,
}: { icon: React.ReactNode; title: string }) {
	return (
		<View className="mb-3 mt-2 flex-row items-center">
			{icon}
			<Text className="ml-2 text-lg font-bold text-foreground">{title}</Text>
		</View>
	);
}

function EmptyText({ text }: { text: string }) {
	const theme = useThemeColors();
	return (
		<View className="mb-3 items-center rounded-2xl border border-dashed border-neutral-300 bg-card p-6">
			<Users size={28} color={theme.neutral400} />
			<Text className="mt-2 text-center text-xs text-neutral-400">{text}</Text>
		</View>
	);
}

function Loading() {
	const theme = useThemeColors();
	return (
		<View className="items-center justify-center py-12">
			<ActivityIndicator size="large" color={theme.primaryInk} />
		</View>
	);
}
