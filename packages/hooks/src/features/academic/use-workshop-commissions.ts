import {
	ACADEMIC_ROUTES,
	type ApiResponse,
	type IWorkshopCommissionResponse,
} from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export function useWorkshopCommissions(courseId?: string, enabled = true) {
	return useQuery<IWorkshopCommissionResponse[]>({
		queryKey: queryKeys.workshopCommissions.byCourse(courseId ?? ''),
		queryFn: async () => {
			const res = await apiClient.get<ApiResponse<IWorkshopCommissionResponse[]>>(
				ACADEMIC_ROUTES.workshopCommissions(courseId as string),
			);
			return res.data.data ?? [];
		},
		enabled: Boolean(courseId) && enabled,
	});
}
