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
			const body: {
				firstName?: string;
				lastName?: string;
				birthDate?: string;
				tutorName?: string;
				tutorPhone?: string;
				tutorEmail?: string;
			} = {};
			if (data.firstName !== undefined) body.firstName = data.firstName;
			if (data.lastName !== undefined) body.lastName = data.lastName;
			if (data.birthDate !== undefined) body.birthDate = data.birthDate;
			if (data.tutorName !== undefined) body.tutorName = data.tutorName;
			if (data.tutorPhone !== undefined) body.tutorPhone = data.tutorPhone;
			// Omit empty/whitespace values so the API's @IsEmail validator passes.
			const tutorEmail = data.tutorEmail?.trim();
			if (tutorEmail) body.tutorEmail = tutorEmail;
			const res = await apiClient.put<ApiResponse<IStudentDetailResponse>>(
				STUDENT_ROUTES.student(id),
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
	});
}
