import {
	type CreateStudentFormValues,
	type IStudentDetailResponse,
	STUDENT_ROUTES,
} from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export function useCreateStudent() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: CreateStudentFormValues) => {
			const res = await apiClient.post<IStudentDetailResponse>(
				STUDENT_ROUTES.students,
				data,
			);
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.students.list() });
		},
	});
}
