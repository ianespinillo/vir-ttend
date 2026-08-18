import {
	ANNOUNCEMENT_ROUTES,
	type AnnouncementsListResponse,
	type ApiResponse,
} from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export interface UseAnnouncementsParams {
	status?: 'draft' | 'published';
	targetType?: 'school' | 'course' | 'level';
	page?: number;
	limit?: number;
}

export function useAnnouncements(params: UseAnnouncementsParams = {}) {
	const { status, targetType, page = 1, limit = 20 } = params;
	return useQuery<AnnouncementsListResponse>({
		queryKey: queryKeys.announcements.list({ status, targetType, page, limit }),
		queryFn: async () => {
			const res = await apiClient.get<ApiResponse<AnnouncementsListResponse>>(
				ANNOUNCEMENT_ROUTES.announcements,
				{ params: { status, targetType, page, limit } },
			);
			return res.data.data;
		},
		staleTime: 1000 * 60 * 2,
	});
}
