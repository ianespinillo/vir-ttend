import {
	ACADEMIC_ROUTES,
	type CreateCourseFormValues,
	type ICourseResponse,
} from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export function useCreateCourse() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: CreateCourseFormValues) => {
			const res = await apiClient.post<ICourseResponse>(
				ACADEMIC_ROUTES.courses,
				data,
			);
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['courses'] });
		},
	});
}
