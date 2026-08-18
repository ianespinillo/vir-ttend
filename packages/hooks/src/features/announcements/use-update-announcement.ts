import {
	ANNOUNCEMENT_ROUTES,
	type Announcement,
	type ApiResponse,
	type UpdateAnnouncementPayload,
} from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export interface UpdateAnnouncementVariables {
	id: string;
	data: UpdateAnnouncementPayload;
}

export function useUpdateAnnouncement() {
	const queryClient = useQueryClient();

	return useMutation<Announcement, Error, UpdateAnnouncementVariables>({
		mutationFn: async ({ id, data }) => {
			const res = await apiClient.put<ApiResponse<Announcement>>(
				ANNOUNCEMENT_ROUTES.announcement(id),
				data,
			);
			return res.data.data;
		},
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({ queryKey: ['announcements', 'list'] });
			queryClient.invalidateQueries({
				queryKey: queryKeys.announcements.detail(variables.id),
			});
			queryClient.invalidateQueries({ queryKey: queryKeys.announcements.forMe });
		},
	});
}
