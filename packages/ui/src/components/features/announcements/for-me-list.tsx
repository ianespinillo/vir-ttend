'use client';

import type { Announcement } from '@repo/common';
import { Megaphone } from 'lucide-react';
import { Skeleton } from '../../../ui/skeleton';
import { EmptyState } from '../../shared/empty-state';
import { AnnouncementCard } from './announcement-card';

export interface ForMeListProps {
	announcements?: Announcement[];
	isLoading?: boolean;
	readIds?: Set<string>;
	courseNames?: Record<string, string>;
	onOpen?: (announcement: Announcement) => void;
}

export function ForMeList({
	announcements,
	isLoading,
	readIds,
	courseNames,
	onOpen,
}: Readonly<ForMeListProps>) {
	if (isLoading) {
		return (
			<div className="border rounded-lg border-border/80">
				{[1, 2, 3, 4, 5].map((i) => (
					<div
						key={i}
						data-testid="skeleton-row"
						className="flex items-start gap-3 p-4 border-b border-border/50 last:border-b-0"
					>
						<Skeleton className="h-5 w-5 rounded-full shrink-0" />
						<div className="flex-1 space-y-2">
							<Skeleton className="h-4 w-48" />
							<Skeleton className="h-3 w-full max-w-md" />
							<Skeleton className="h-3 w-32" />
						</div>
					</div>
				))}
			</div>
		);
	}

	const items = announcements ?? [];

	if (items.length === 0) {
		return (
			<div className="border rounded-lg border-border/80">
				<EmptyState
					icon={<Megaphone className="h-10 w-10 text-muted-foreground" />}
					title="Sin comunicados para vos"
					description="No hay anuncios dirigidos a tu perfil por ahora."
				/>
			</div>
		);
	}

	return (
		<div className="border rounded-lg border-border/80 overflow-hidden">
			{items.map((announcement) => (
				<AnnouncementCard
					key={announcement.id}
					announcement={announcement}
					isUnread={!readIds?.has(announcement.id)}
					targetLabel={courseNames?.[announcement.targetId]}
					onOpen={onOpen}
				/>
			))}
		</div>
	);
}
