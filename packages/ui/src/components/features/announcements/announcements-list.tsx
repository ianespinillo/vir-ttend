'use client';

import type { AnnouncementsListResponse } from '@repo/common';
import { Megaphone } from 'lucide-react';
import { Button } from '../../../ui/button';
import { Skeleton } from '../../../ui/skeleton';
import { EmptyState } from '../../shared/empty-state';
import { AnnouncementCard } from './announcement-card';

export interface AnnouncementsListProps {
	data: AnnouncementsListResponse | null;
	isLoading?: boolean;
	readIds?: Set<string>;
	courseNames?: Record<string, string>;
	statusVisible?: boolean;
	onOpen?: (announcementId: string) => void;
	onPageChange?: (page: number) => void;
}

export function AnnouncementsList({
	data,
	isLoading,
	readIds,
	courseNames,
	statusVisible,
	onOpen,
	onPageChange,
}: Readonly<AnnouncementsListProps>) {
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

	if (!data || data.items.length === 0) {
		return (
			<div className="border rounded-lg border-border/80">
				<EmptyState
					icon={<Megaphone className="h-10 w-10 text-muted-foreground" />}
					title="Sin comunicados"
					description="Todavía no hay comunicados para mostrar."
				/>
			</div>
		);
	}

	return (
		<div className="border rounded-lg border-border/80 overflow-hidden">
			{data.items.map((announcement) => (
				<AnnouncementCard
					key={announcement.id}
					announcement={announcement}
					isUnread={
						announcement.status !== 'draft' && !readIds?.has(announcement.id)
					}
					statusVisible={statusVisible}
					targetLabel={courseNames?.[announcement.targetId]}
					onOpen={(a) => onOpen?.(a.id)}
				/>
			))}

			{data.totalPages > 1 && (
				<div className="flex items-center justify-between p-4">
					<p className="text-sm text-muted-foreground">
						Página {data.page} de {data.totalPages} ({data.total} total)
					</p>
					<div className="flex gap-2">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => onPageChange?.(data.page - 1)}
							disabled={data.page <= 1}
						>
							Anterior
						</Button>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => onPageChange?.(data.page + 1)}
							disabled={data.page >= data.totalPages}
						>
							Siguiente
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
