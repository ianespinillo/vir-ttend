import {
	type ApiResponse,
	type MonthlyReport,
	REPORT_ROUTES,
} from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export interface GenerateReportPayload {
	courseId: string;
	month: number;
	year: number;
}

export function useGenerateReport() {
	const queryClient = useQueryClient();

	return useMutation<MonthlyReport, Error, GenerateReportPayload>({
		mutationFn: async (data) => {
			const res = await apiClient.post<ApiResponse<MonthlyReport>>(
				REPORT_ROUTES.generate,
				data,
			);
			return res.data.data;
		},
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.reports.monthly(
					variables.courseId,
					variables.month,
					variables.year,
				),
			});
			queryClient.invalidateQueries({
				queryKey: queryKeys.reports.available(variables.courseId),
			});
		},
	});
}
