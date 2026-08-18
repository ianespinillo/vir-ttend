import {
	ACADEMIC_ROUTES,
	type ApiResponse,
	type ISubjectResponse,
} from '@repo/common';
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
			const res = await apiClient.get<ApiResponse<ISubjectResponse[]>>(
				ACADEMIC_ROUTES.subjects,
				{
					params: {
						teacherId,
						academicYearId,
					},
				},
			);
			return res.data.data ?? [];
		},
		enabled: Boolean(teacherId && academicYearId),
	});
}
