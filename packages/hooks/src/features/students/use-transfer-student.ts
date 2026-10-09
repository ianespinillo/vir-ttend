import {
	type ApiResponse,
	type ErrorResponse,
	STUDENT_ROUTES,
} from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export interface TransferStudentPayload {
	id: string;
	reason?: string;
}

export function useTransferStudent() {
	const queryClient = useQueryClient();

	return useMutation<unknown, AxiosError<ErrorResponse>, TransferStudentPayload>(
		{
			mutationFn: async ({ id, reason }) => {
				const body = reason ? { reason } : {};
				const res = await apiClient.post<ApiResponse<unknown>>(
					STUDENT_ROUTES.transfer(id),
					body,
				);
				return res.data.data;
			},
			onSuccess: (_, variables) => {
				queryClient.invalidateQueries({
					queryKey: queryKeys.students.detail(variables.id),
				});
				queryClient.invalidateQueries({ queryKey: queryKeys.students.list() });
			},
		},
	);
}
