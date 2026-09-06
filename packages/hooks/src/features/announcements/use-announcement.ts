import {
	ANNOUNCEMENT_ROUTES,
	type Announcement,
	type ApiResponse,
} from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export function useAnnouncement(id: string, options?: { enabled?: boolean }) {
	const { enabled = true } = options ?? {};
	return useQuery<Announcement>({
		queryKey: queryKeys.announcements.detail(id),
		queryFn: async () => {
			const res = await apiClient.get<ApiResponse<Announcement>>(
				ANNOUNCEMENT_ROUTES.announcement(id),
			);
			return res.data.data;
		},
		enabled: Boolean(id) && enabled,
		staleTime: 1000 * 60 * 2,
	});
}
