import {
	ACADEMIC_ROUTES,
	type ApiResponse,
	type IAcademicYearResponse,
	type IDeclareNonWorkingDayPayload,
} from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export interface DeclareNonWorkingDayVariables {
	academicYearId: string;
	data: IDeclareNonWorkingDayPayload;
}

export function useDeclareNonWorkingDay() {
	const queryClient = useQueryClient();

	return useMutation<
		IAcademicYearResponse,
		Error,
		DeclareNonWorkingDayVariables
	>({
		mutationFn: async ({ academicYearId, data }) => {
			const res = await apiClient.post<ApiResponse<IAcademicYearResponse>>(
				ACADEMIC_ROUTES.academicYearNonWorkingDays(academicYearId),
				data,
			);
			return res.data.data;
		},
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({ queryKey: queryKeys.academicYears.all });
			queryClient.invalidateQueries({
				queryKey: queryKeys.academicYears.active,
			});
			queryClient.invalidateQueries({
				queryKey: queryKeys.academicYears.detail(variables.academicYearId),
			});
			queryClient.invalidateQueries({ queryKey: ['announcements'] });
		},
	});
}
