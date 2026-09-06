'use client';

import { useCallback, useMemo, useState } from 'react';
import { loadReadIds, persistReadId } from './read-state';

export function useReadAnnouncements(userId?: string) {
	const [version, setVersion] = useState(0);

	const readIds = useMemo(() => {
		void version;
		return loadReadIds(userId ?? '');
	}, [userId, version]);

	const markRead = useCallback(
		(id: string) => {
			if (!userId) return;
			persistReadId(userId, id);
			setVersion((v) => v + 1);
		},
		[userId],
	);

	return { readIds, markRead };
}
