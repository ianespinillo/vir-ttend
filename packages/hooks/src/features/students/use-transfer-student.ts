import { STUDENT_ROUTES, type TransferFormValues } from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export interface TransferStudentParams {
	id: string;
	data: TransferFormValues;
}

export function useTransferStudent() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ id, data }: TransferStudentParams) => {
			const res = await apiClient.post(STUDENT_ROUTES.transfer(id), data);
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
