import {
	type IStudentDetailResponse,
	STUDENT_ROUTES,
	type UpdateStudentFormValues,
} from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export interface UpdateStudentParams {
	id: string;
	data: UpdateStudentFormValues;
}

export function useUpdateStudent() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ id, data }: UpdateStudentParams) => {
			const res = await apiClient.put<IStudentDetailResponse>(
				STUDENT_ROUTES.student(id),
				data,
			);
			return res.data;
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.students.detail(variables.id),
			});
			queryClient.invalidateQueries({ queryKey: queryKeys.students.list() });
		},
	});
}
