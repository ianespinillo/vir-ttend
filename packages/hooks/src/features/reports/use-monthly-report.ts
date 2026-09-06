import {
	type ApiResponse,
	type MonthlyReport,
	REPORT_ROUTES,
} from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export interface UseMonthlyReportParams {
	courseId?: string;
	month?: number;
	year?: number;
}

export function useMonthlyReport({
	courseId,
	month,
	year,
}: UseMonthlyReportParams = {}) {
	return useQuery<MonthlyReport>({
		queryKey: queryKeys.reports.monthly(courseId ?? '', month ?? 0, year ?? 0),
		queryFn: async () => {
			const res = await apiClient.get<ApiResponse<MonthlyReport>>(
				REPORT_ROUTES.monthly,
				{ params: { courseId, month, year } },
			);
			return res.data.data;
		},
		enabled: Boolean(courseId && month && year),
		staleTime: 1000 * 60 * 10, // reports are expensive, cache longer
	});
}
