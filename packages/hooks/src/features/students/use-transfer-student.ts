import {
	type ApiResponse,
	type ErrorResponse,
	STUDENT_ROUTES,
	type TransferFormValues,
} from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export interface TransferStudentParams {
	id: string;
	data: TransferFormValues;
}

export function useTransferStudent() {
	const queryClient = useQueryClient();

	return useMutation<unknown, AxiosError<ErrorResponse>, TransferStudentParams>({
		mutationFn: async ({ id, data }) => {
			const res = await apiClient.post<ApiResponse<unknown>>(
				STUDENT_ROUTES.transfer(id),
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
