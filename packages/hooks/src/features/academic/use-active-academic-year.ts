import { ACADEMIC_ROUTES, type IAcademicYearResponse } from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export function useActiveAcademicYear() {
	return useQuery<IAcademicYearResponse | null>({
		queryKey: ['academic-years', 'active'],
		queryFn: async () => {
			const res = await apiClient.get<IAcademicYearResponse[]>(
				ACADEMIC_ROUTES.academicYears,
			);
			const years = res.data || [];
			if (years.length === 0) return null;
			const active = years.find((y) => y.isActive);
			return active || years[0] || null;
		},
	});
}
