import {
	ACADEMIC_ROUTES,
	type ICourseResponse,
	type UpdateCourseFormValues,
} from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export interface UpdateCourseParams {
	id: string;
	data: UpdateCourseFormValues;
}

export function useUpdateCourse() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ id, data }: UpdateCourseParams) => {
			const res = await apiClient.put<ICourseResponse>(
				ACADEMIC_ROUTES.course(id),
				data,
			);
			if (data.preceptorId) {
				await apiClient.put(ACADEMIC_ROUTES.coursePreceptor(id), {
					preceptorId: data.preceptorId,
				});
			}
			return res.data;
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.courses.detail(variables.id),
			});
			queryClient.invalidateQueries({ queryKey: ['courses'] });
		},
	});
}
