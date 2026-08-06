import { ACADEMIC_ROUTES, type ISubjectResponse } from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';

export function useSubjects(courseId?: string) {
	return useQuery<ISubjectResponse[]>({
		queryKey: ['subjects', 'list', courseId ?? 'all'],
		queryFn: async () => {
			const res = await apiClient.get<ISubjectResponse[]>(
				ACADEMIC_ROUTES.subjects,
				{
					params: { courseId },
				},
			);
			return res.data;
		},
		enabled: courseId === undefined || Boolean(courseId),
	});
}
