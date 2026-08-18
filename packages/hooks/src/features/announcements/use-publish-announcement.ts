import {
	ANNOUNCEMENT_ROUTES,
	type Announcement,
	type ApiResponse,
} from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export function usePublishAnnouncement() {
	const queryClient = useQueryClient();

	return useMutation<Announcement, Error, string>({
		mutationFn: async (id) => {
			const res = await apiClient.patch<ApiResponse<Announcement>>(
				ANNOUNCEMENT_ROUTES.publish(id),
			);
			return res.data.data;
		},
		onSuccess: (_data, id) => {
			queryClient.invalidateQueries({ queryKey: ['announcements', 'list'] });
			queryClient.invalidateQueries({
				queryKey: queryKeys.announcements.detail(id),
			});
			queryClient.invalidateQueries({ queryKey: queryKeys.announcements.forMe });
		},
	});
}
