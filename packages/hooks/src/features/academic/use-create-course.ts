import {
	ACADEMIC_ROUTES,
	type ApiResponse,
	type CreateCourseFormValues,
	type ErrorResponse,
	type ICourseResponse,
} from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient } from '../../lib/axios-client';

export function useCreateCourse() {
	const queryClient = useQueryClient();

	return useMutation<
		ICourseResponse,
		AxiosError<ErrorResponse>,
		CreateCourseFormValues
	>({
		mutationFn: async (data) => {
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
