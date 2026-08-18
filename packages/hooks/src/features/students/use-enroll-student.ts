import {
	type ApiResponse,
	type EnrollFormValues,
	STUDENT_ROUTES,
} from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export interface EnrollStudentParams {
	id: string;
	data: EnrollFormValues;
}

export function useEnrollStudent() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ id, data }: EnrollStudentParams) => {
			const res = await apiClient.post<ApiResponse<unknown>>(
				STUDENT_ROUTES.enroll(id),
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
