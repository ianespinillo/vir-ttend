import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	AttendanceRecord,
	AttendanceStatus,
	DailyAttendanceMetric,
} from '../entities';
import { AttendanceService } from '../services/api.service';

const EMPTY_RECORDS: AttendanceRecord[] = [];
const DEFAULT_METRICS: DailyAttendanceMetric = {
	totalStudents: 0,
	presentCount: 0,
	absentCount: 0,
	lateCount: 0,
	justifiedCount: 0,
	attendancePercentage: 0,
};

export const useAttendance = (options?: {
	courseId?: string;
	subjectId?: string;
	date?: string;
}) => {
	const queryClient = useQueryClient();
	const { courseId, subjectId, date } = options ?? {};

	const dailyAttendanceQuery = useQuery<AttendanceRecord[]>({
		queryKey: ['attendance', 'daily', courseId, date],
		queryFn: () =>
			AttendanceService.getDailyAttendance(courseId ?? '', date ?? ''),
		enabled: !!courseId && !!date && !subjectId,
		staleTime: 1000 * 60 * 2, // 2 minutes cache
	});

	const subjectAttendanceQuery = useQuery<AttendanceRecord[]>({
		queryKey: ['attendance', 'subject', courseId, subjectId, date],
		queryFn: () =>
			AttendanceService.getSubjectAttendance(
				courseId ?? '',
				subjectId ?? '',
				date ?? '',
			),
		enabled: !!courseId && !!subjectId && !!date,
		staleTime: 1000 * 60 * 2,
	});

	const dashboardMetricsQuery = useQuery<DailyAttendanceMetric>({
		queryKey: ['attendance', 'metrics', courseId],
		queryFn: () => AttendanceService.getDashboardMetrics(courseId),
		staleTime: 1000 * 60 * 5,
	});

	const registerAttendanceMutation = useMutation({
		mutationFn: AttendanceService.registerAttendance,
		onSuccess: (_, variables) => {
			// Invalidate all attendance records and metrics
			queryClient.invalidateQueries({ queryKey: ['attendance'] });
		},
	});

	return {
		records:
			(subjectId ? subjectAttendanceQuery.data : dailyAttendanceQuery.data) ??
			EMPTY_RECORDS,
		isRecordsLoading: subjectId
			? subjectAttendanceQuery.isLoading
			: dailyAttendanceQuery.isLoading,
		recordsError: subjectId
			? subjectAttendanceQuery.error
			: dailyAttendanceQuery.error,

		metrics: dashboardMetricsQuery.data ?? DEFAULT_METRICS,
		isMetricsLoading: dashboardMetricsQuery.isLoading,

		registerAttendance: registerAttendanceMutation.mutateAsync,
		isRegistering: registerAttendanceMutation.isPending,
	};
};
