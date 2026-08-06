import {
	ACADEMIC_ROUTES,
	type CreateAcademicYearFormValues,
	type IAcademicYearResponse,
} from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export function useCreateAcademicYear() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: CreateAcademicYearFormValues) => {
			const res = await apiClient.post<IAcademicYearResponse>(
				ACADEMIC_ROUTES.academicYears,
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
