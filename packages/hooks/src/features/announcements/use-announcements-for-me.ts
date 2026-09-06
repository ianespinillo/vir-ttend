import {
	ANNOUNCEMENT_ROUTES,
	type Announcement,
	type ApiResponse,
} from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export interface UseAnnouncementsForMeParams {
	courseId?: string;
	level?: string;
}

export function useAnnouncementsForMe(
	params: UseAnnouncementsForMeParams = {},
) {
	const { courseId, level } = params;
	return useQuery<Announcement[]>({
		queryKey: queryKeys.announcements.forMe,
		queryFn: async () => {
			const res = await apiClient.get<ApiResponse<Announcement[]>>(
				ANNOUNCEMENT_ROUTES.forMe,
				{ params: { courseId, level } },
			);
			return res.data.data ?? [];
		},
		staleTime: 1000 * 60 * 2,
	});
}
