import {
	type ApiResponse,
	type CreateStudentFormValues,
	type ErrorResponse,
	type IStudentDetailResponse,
	STUDENT_ROUTES,
} from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export function useCreateStudent() {
	const queryClient = useQueryClient();

	return useMutation<
		IStudentDetailResponse,
		AxiosError<ErrorResponse>,
		CreateStudentFormValues
	>({
		mutationFn: async (data: CreateStudentFormValues) => {
			const { tutorEmail, ...rest } = data;
			const body: CreateStudentFormValues = { ...rest };
			// Omit empty/whitespace tutor emails so the API's @IsOptional applies.
			const normalizedTutorEmail = tutorEmail?.trim();
			if (normalizedTutorEmail) body.tutorEmail = normalizedTutorEmail;
			const res = await apiClient.post<ApiResponse<IStudentDetailResponse>>(
				STUDENT_ROUTES.students,
				body,
			);
			return res.data.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.students.list() });
		},
	});
}
