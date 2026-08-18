import {
	type ApiResponse,
	type ErrorResponse,
	type IStudentDetailResponse,
	STUDENT_ROUTES,
	type UpdateStudentFormValues,
} from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export interface UpdateStudentParams {
	id: string;
	data: UpdateStudentFormValues;
}

export function useUpdateStudent() {
	const queryClient = useQueryClient();

	return useMutation<
		IStudentDetailResponse,
		AxiosError<ErrorResponse>,
		UpdateStudentParams
	>({
		mutationFn: async ({ id, data }: UpdateStudentParams) => {
			const res = await apiClient.put<ApiResponse<IStudentDetailResponse>>(
				STUDENT_ROUTES.student(id),
				data,
			);
			return res.data.data;
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.students.detail(variables.id),
			});
			queryClient.invalidateQueries({ queryKey: queryKeys.students.list() });
		},
	});
}
