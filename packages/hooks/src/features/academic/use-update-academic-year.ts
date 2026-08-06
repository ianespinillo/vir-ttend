import {
	ACADEMIC_ROUTES,
	type IAcademicYearResponse,
	type UpdateAcademicYearFormValues,
} from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export interface UpdateAcademicYearParams {
	id: string;
	data: UpdateAcademicYearFormValues;
}

export function useUpdateAcademicYear() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ id, data }: UpdateAcademicYearParams) => {
			const res = await apiClient.put<IAcademicYearResponse>(
				ACADEMIC_ROUTES.academicYear(id),
				data,
			);
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.academicYears.all });
			queryClient.invalidateQueries({ queryKey: ['academic-years', 'active'] });
		},
	});
}
