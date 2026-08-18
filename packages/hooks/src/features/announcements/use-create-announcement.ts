import {
	ANNOUNCEMENT_ROUTES,
	type Announcement,
	type ApiResponse,
	type CreateAnnouncementPayload,
} from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export function useCreateAnnouncement() {
	const queryClient = useQueryClient();

	return useMutation<Announcement, Error, CreateAnnouncementPayload>({
		mutationFn: async (data) => {
			const res = await apiClient.post<ApiResponse<Announcement>>(
				ANNOUNCEMENT_ROUTES.announcements,
				data,
			);
			return res.data.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['announcements', 'list'] });
			queryClient.invalidateQueries({ queryKey: queryKeys.announcements.forMe });
		},
	});
}
