import {
	ACADEMIC_ROUTES,
	type ApiResponse,
	type IAcademicYearResponse,
} from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export function useAcademicYears() {
	return useQuery<IAcademicYearResponse[]>({
		queryKey: queryKeys.academicYears.all,
		queryFn: async () => {
			const res = await apiClient.get<ApiResponse<IAcademicYearResponse[]>>(
				ACADEMIC_ROUTES.academicYears,
			);
			return res.data.data ?? [];
		},
		staleTime: 1000 * 60 * 10,
	});
}
