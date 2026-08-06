import {
	type IStudentResponse,
	type PaginatedResponse,
	STUDENT_ROUTES,
	type StudentStatus,
} from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export interface UseStudentsFilters extends Record<string, unknown> {
	courseId?: string;
	status?: StudentStatus | 'ALL' | string;
	page?: number;
	limit?: number;
	search?: string;
}

export function useStudents(filters?: UseStudentsFilters) {
	return useQuery<PaginatedResponse<IStudentResponse>>({
		queryKey: queryKeys.students.list(filters),
		queryFn: async () => {
			const res = await apiClient.get<PaginatedResponse<IStudentResponse>>(
				STUDENT_ROUTES.students,
				{
					params: filters,
				},
			);
			return res.data;
		},
	});
}
