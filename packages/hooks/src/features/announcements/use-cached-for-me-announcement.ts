'use client';

import type { Announcement } from '@repo/common';
import { useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

export function useCachedForMeAnnouncement(id: string) {
	const queryClient = useQueryClient();
	return useMemo(() => {
		if (!id) return null;
		for (const query of queryClient.getQueryCache().getAll()) {
			const key = query.queryKey as unknown[];
			if (key[0] !== 'announcements' || key[1] !== 'for-me') continue;
			const data = query.state.data as Announcement[] | undefined;
			const found = data?.find((a) => a.id === id);
			if (found) return found;
		}
		return null;
	}, [queryClient, id]);
}
