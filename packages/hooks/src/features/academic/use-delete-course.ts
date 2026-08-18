import { ACADEMIC_ROUTES, type ApiResponse } from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';

export function useDeleteCourse() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
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
