import {
	ACADEMIC_ROUTES,
	type ApiResponse,
	type CreateCourseFormValues,
	type ICourseResponse,
} from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';

export function useCreateCourse() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: CreateCourseFormValues) => {
			const res = await apiClient.post<ApiResponse<ICourseResponse>>(
				ACADEMIC_ROUTES.courses,
				data,
			);
			return res.data.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['courses'] });
		},
	});
}
