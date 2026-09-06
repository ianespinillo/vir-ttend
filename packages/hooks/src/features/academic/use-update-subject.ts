import {
	ACADEMIC_ROUTES,
	type ApiResponse,
	type ErrorResponse,
	type ISubjectResponse,
	type UpdateSubjectFormValues,
} from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient } from '../../lib/axios-client';

export interface UpdateSubjectParams {
	id: string;
	courseId?: string;
	data: UpdateSubjectFormValues;
}

export function useUpdateSubject() {
	const queryClient = useQueryClient();

	return useMutation<
		ISubjectResponse,
		AxiosError<ErrorResponse>,
		UpdateSubjectParams
	>({
		mutationFn: async ({ id, data }) => {
			const res = await apiClient.put<ApiResponse<ISubjectResponse>>(
				ACADEMIC_ROUTES.subject(id),
				data,
			);
			if (data.teacherId) {
				await apiClient.put<ApiResponse<void>>(ACADEMIC_ROUTES.subjectTeacher(id), {
					teacherId: data.teacherId,
				});
			}
			return res.data.data;
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: ['subjects'] });
			if (variables.courseId) {
				queryClient.invalidateQueries({
					queryKey: ['courses', 'detail', variables.courseId],
				});
			}
		},
	});
}
