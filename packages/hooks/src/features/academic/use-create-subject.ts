import {
	ACADEMIC_ROUTES,
	type ApiResponse,
	type CreateSubjectFormValues,
	type ISubjectResponse,
} from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export function useCreateSubject() {
	const queryClient = useQueryClient();

	return useMutation<ISubjectResponse, Error, CreateSubjectFormValues>({
		mutationFn: async (data) => {
			const res = await apiClient.post<ApiResponse<ISubjectResponse>>(
				ACADEMIC_ROUTES.subjects,
				data,
			);
			return res.data.data;
		},
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.subjects.list(variables.courseId),
			});
			queryClient.invalidateQueries({
				queryKey: queryKeys.courses.detail(variables.courseId),
			});
		},
	});
}
