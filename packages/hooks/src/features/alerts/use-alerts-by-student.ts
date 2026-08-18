import {
	ALERT_ROUTES,
	type AlertsListResponse,
	type ApiResponse,
} from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export interface UseAlertsByStudentParams {
	studentId?: string;
	academicYearId?: string;
}

export function useAlertsByStudent({
	studentId,
	academicYearId,
}: UseAlertsByStudentParams = {}) {
	return useQuery<AlertsListResponse>({
		queryKey: queryKeys.alerts.byStudent(studentId ?? '', academicYearId ?? ''),
		queryFn: async () => {
			const res = await apiClient.get<ApiResponse<AlertsListResponse>>(
				ALERT_ROUTES.byStudent(studentId as string),
				{ params: { academicYearId } },
			);
			return res.data.data;
		},
		enabled: Boolean(studentId && academicYearId),
		staleTime: 1000 * 60 * 2,
	});
}
