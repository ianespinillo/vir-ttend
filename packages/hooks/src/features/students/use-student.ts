import { type IStudentDetailResponse, STUDENT_ROUTES } from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export function useStudent(id: string) {
	return useQuery<IStudentDetailResponse>({
		queryKey: queryKeys.students.detail(id),
		queryFn: async () => {
			const res = await apiClient.get<IStudentDetailResponse>(
				STUDENT_ROUTES.student(id),
			);
			return res.data;
		},
		enabled: Boolean(id),
	});
}
