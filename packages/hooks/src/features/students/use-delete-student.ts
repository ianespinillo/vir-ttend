import {
	type ApiResponse,
	type IStudentResponse,
	type PaginatedResponse,
	STUDENT_ROUTES,
} from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export function useDeleteStudent() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			// Soft delete endpoint or status update via PUT
			const res = await apiClient.put<ApiResponse<IStudentResponse>>(
				STUDENT_ROUTES.student(id),
				{
					status: 'INACTIVE',
				},
			);
			return res.data.data;
		},
		onMutate: async (id: string) => {
			await queryClient.cancelQueries({ queryKey: ['students'] });

			const previousListData = queryClient.getQueriesData<
				PaginatedResponse<IStudentResponse>
			>({ queryKey: ['students', 'list'] });

			queryClient.setQueriesData<PaginatedResponse<IStudentResponse>>(
				{ queryKey: ['students', 'list'] },
				(old) => {
					if (!old) return old;
					return {
						...old,
						items: old.items.map((student) =>
							student.id === id ? { ...student, status: 'INACTIVE' } : student,
						),
					};
				},
			);

			return { previousListData };
		},
		onError: (_err, _id, context) => {
			if (context?.previousListData) {
				for (const [key, data] of context.previousListData) {
					queryClient.setQueryData(key, data);
				}
			}
		},
		onSettled: (_data, _error, id) => {
			queryClient.invalidateQueries({ queryKey: ['students'] });
			queryClient.invalidateQueries({
				queryKey: queryKeys.students.detail(id),
			});
		},
	});
}
