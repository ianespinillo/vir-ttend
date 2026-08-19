import {
	ACADEMIC_ROUTES,
	type ApiResponse,
	type ErrorResponse,
} from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient } from '../../lib/axios-client';

export function useDeleteCourse() {
	const queryClient = useQueryClient();

	return useMutation<void, AxiosError<ErrorResponse>, string>({
		mutationFn: async (id) => {
			const res = await apiClient.delete<ApiResponse<void>>(
				ACADEMIC_ROUTES.course(id),
			);
			return res.data.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['courses'] });
		},
	});
}
