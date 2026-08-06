import { type IUserResponse, USER_ROUTES } from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';

export function useUsersByRole(role?: string) {
	return useQuery<IUserResponse[]>({
		queryKey: ['users', 'role', role ?? 'all'],
		queryFn: async () => {
			const res = await apiClient.get<IUserResponse[]>(USER_ROUTES.users, {
				params: { role },
			});
			return res.data;
		},
		enabled: Boolean(role),
	});
}
