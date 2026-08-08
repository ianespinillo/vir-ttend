import { ACADEMIC_ROUTES, type ISubjectResponse } from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export interface UseTeacherSubjectsParams {
	teacherId?: string;
	academicYearId?: string;
}

export function useTeacherSubjects({
	teacherId,
	academicYearId,
}: UseTeacherSubjectsParams = {}) {
	return useQuery<ISubjectResponse[]>({
		queryKey: queryKeys.subjects.teacher(teacherId || '', academicYearId),
		queryFn: async () => {
			const res = await apiClient.get<ISubjectResponse[]>(
				ACADEMIC_ROUTES.subjects,
				{
					params: {
						teacherId,
						academicYearId,
					},
				},
			);
			const data =
				(res.data as unknown as { data?: ISubjectResponse[] })?.data ?? res.data;
			return Array.isArray(data) ? data : [];
		},
		enabled: Boolean(teacherId && academicYearId),
	});
}
