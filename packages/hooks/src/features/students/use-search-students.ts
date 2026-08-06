import { type IStudentResponse, STUDENT_ROUTES } from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';

export function useSearchStudents(query: string) {
	const trimmed = query.trim();

	return useQuery<IStudentResponse[]>({
		queryKey: ['students', 'search', trimmed],
		queryFn: async () => {
			const res = await apiClient.get<IStudentResponse[]>(STUDENT_ROUTES.search, {
				params: { q: trimmed },
			});
			return res.data;
		},
		enabled: trimmed.length > 0,
	});
}
