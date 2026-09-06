import {
	ACADEMIC_ROUTES,
	type ApiResponse,
	type IAcademicYearResponse,
	type UpdateAcademicYearFormValues,
} from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export interface UpdateAcademicYearVariables {
	id: string;
	data: UpdateAcademicYearFormValues;
}

export function useUpdateAcademicYear() {
	const queryClient = useQueryClient();

	return useMutation<IAcademicYearResponse, Error, UpdateAcademicYearVariables>({
		mutationFn: async ({ id, data }) => {
			const res = await apiClient.put<ApiResponse<IAcademicYearResponse>>(
				ACADEMIC_ROUTES.academicYear(id),
				data,
			);
			return res.data.data;
		},
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({ queryKey: queryKeys.academicYears.all });
			queryClient.invalidateQueries({ queryKey: queryKeys.academicYears.active });
			queryClient.invalidateQueries({
				queryKey: queryKeys.academicYears.detail(variables.id),
			});
		},
	});
}
