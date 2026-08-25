import {
	type ApiResponse,
	type ChangePasswordPayload,
	USER_ROUTES,
} from '@repo/common';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';

export function useChangePassword() {
	return useMutation<void, Error, ChangePasswordPayload>({
		mutationFn: async (payload) => {
			await apiClient.patch<ApiResponse<void>>(
				USER_ROUTES.changePassword,
				payload,
			);
		},
	});
}
