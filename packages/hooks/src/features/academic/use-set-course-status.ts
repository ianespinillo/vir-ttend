import {
	ACADEMIC_ROUTES,
	type ApiResponse,
	type ErrorResponse,
	type ICourseResponse,
} from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export interface SetCourseStatusParams {
	courseId: string;
	isActive: boolean;
}

/** Activates or deactivates a course without touching its subjects or schedule. */
export function useSetCourseStatus() {
	const queryClient = useQueryClient();

	return useMutation<
		ICourseResponse,
		AxiosError<ErrorResponse>,
		SetCourseStatusParams
	>({
		mutationFn: async ({ courseId, isActive }) => {
			const res = await apiClient.patch<ApiResponse<ICourseResponse>>(
				ACADEMIC_ROUTES.courseStatus(courseId),
				{ isActive },
			);
			return res.data.data;
		},
		onSuccess: (_data, { courseId }) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.courses.detail(courseId),
			});
			queryClient.invalidateQueries({ queryKey: ['courses'] });
			// A reactivated course must reappear in workshop attendance.
			queryClient.invalidateQueries({
				queryKey: ['attendance', 'workshop'],
			});
		},
	});
}
