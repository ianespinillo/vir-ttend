import {
	ACADEMIC_ROUTES,
	type ApiResponse,
	type CreateAcademicYearFormValues,
	type IAcademicYearResponse,
} from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export function useCreateAcademicYear() {
	const queryClient = useQueryClient();

	return useMutation<IAcademicYearResponse, Error, CreateAcademicYearFormValues>(
		{
			mutationFn: async (data) => {
				const res = await apiClient.post<ApiResponse<IAcademicYearResponse>>(
					ACADEMIC_ROUTES.academicYears,
					data,
				);
				return res.data.data;
			},
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: queryKeys.academicYears.all });
				queryClient.invalidateQueries({ queryKey: queryKeys.academicYears.active });
			},
		},
	);
}
