import {
	ACADEMIC_ROUTES,
	type ISubjectResponse,
	type UpdateSubjectFormValues,
} from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';

export interface UpdateSubjectParams {
	id: string;
	courseId?: string;
	data: UpdateSubjectFormValues;
}

export function useUpdateSubject() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ id, data }: UpdateSubjectParams) => {
			const res = await apiClient.put<ISubjectResponse>(
				ACADEMIC_ROUTES.subject(id),
				data,
			);
			if (data.teacherId) {
				await apiClient.put(ACADEMIC_ROUTES.subjectTeacher(id), {
					teacherId: data.teacherId,
				});
			}
			return res.data;
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
