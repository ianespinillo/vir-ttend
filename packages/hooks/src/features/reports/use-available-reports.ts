import {
	type ApiResponse,
	type AvailableReportsResponse,
	REPORT_ROUTES,
} from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export function useAvailableReports(courseId?: string) {
	return useQuery<AvailableReportsResponse>({
		queryKey: queryKeys.reports.available(courseId ?? ''),
		queryFn: async () => {
			const res = await apiClient.get<ApiResponse<AvailableReportsResponse>>(
				REPORT_ROUTES.available(courseId as string),
			);
			return res.data.data;
		},
		enabled: Boolean(courseId),
		staleTime: 1000 * 60 * 5,
	});
}
