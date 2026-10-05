'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';

export interface PublicConfig {
	tenancyMode: 'multi' | 'single';
	tenantName: string;
	tenantSlug: string | null;
	tenantId: string | null;
	allowSuperadmin: boolean;
}

export function usePublicConfig() {
	return useQuery<PublicConfig>({
		queryKey: ['config', 'public'],
		queryFn: async () => {
			const res = await apiClient.get('/config/public');
			const body = res.data;
			if (body && typeof body === 'object' && 'data' in body) {
				return body.data as PublicConfig;
			}
			return body as PublicConfig;
		},
		staleTime: 1000 * 60 * 60,
	});
}
