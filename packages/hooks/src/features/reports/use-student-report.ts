import {
	type ApiResponse,
	REPORT_ROUTES,
	type StudentReport,
} from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export interface UseStudentReportParams {
	studentId?: string;
	academicYearId?: string;
}

export function useStudentReport({
	studentId,
	academicYearId,
}: UseStudentReportParams = {}) {
	return useQuery<StudentReport>({
		queryKey: queryKeys.reports.byStudent(studentId ?? '', academicYearId ?? ''),
		queryFn: async () => {
			const res = await apiClient.get<ApiResponse<StudentReport>>(
				REPORT_ROUTES.byStudent(studentId as string),
				{ params: { academicYearId } },
			);
			return res.data.data;
		},
		enabled: Boolean(studentId && academicYearId),
		staleTime: 1000 * 60 * 10,
	});
}
