import {
	ACADEMIC_ROUTES,
	type ApiResponse,
	type IAcademicYearResponse,
} from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export function useActiveAcademicYear() {
	return useQuery<IAcademicYearResponse | null>({
		queryKey: queryKeys.academicYears.active,
		queryFn: async () => {
			const res = await apiClient.get<ApiResponse<IAcademicYearResponse | null>>(
				`${ACADEMIC_ROUTES.academicYears}/active`,
			);
			return res.data.data ?? null;
		},
		staleTime: 1000 * 60 * 10, // active year rarely changes
	});
}
