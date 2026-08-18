import { ANNOUNCEMENT_ROUTES, type ApiResponse } from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';

export function useDeleteAnnouncement() {
	const queryClient = useQueryClient();

	return useMutation<void, Error, string>({
		mutationFn: async (id) => {
			await apiClient.delete<ApiResponse<void>>(
				ANNOUNCEMENT_ROUTES.announcement(id),
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['announcements'] });
		},
	});
}
