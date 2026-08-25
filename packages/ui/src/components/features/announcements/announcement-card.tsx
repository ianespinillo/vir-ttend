'use client';

import type { Announcement } from '@repo/common';
import { Megaphone } from 'lucide-react';
import { formatRelative } from '../../../lib/format';
import { Badge } from '../../../ui/badge';
import { TargetBadge } from './target-badge';

export interface AnnouncementCardProps {
	announcement: Announcement;
	isUnread?: boolean;
	statusVisible?: boolean;
	targetLabel?: string;
	onOpen?: (announcement: Announcement) => void;
}

export function AnnouncementCard({
	announcement,
	isUnread,
	statusVisible,
	targetLabel,
	onOpen,
}: Readonly<AnnouncementCardProps>) {
	return (
		<button
			type="button"
			onClick={() => onOpen?.(announcement)}
			className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-muted/50 border-b border-border/50 last:border-b-0"
		>
			<span className="mt-0.5 shrink-0">
				<Megaphone className="h-5 w-5 text-muted-foreground" />
			</span>
			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-2">
					{isUnread && (
						<span
							data-testid="unread-dot"
							className="h-2 w-2 rounded-full bg-blue-500 shrink-0"
						/>
					)}
					<p className="truncate font-medium">{announcement.title}</p>
				</div>
				<p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
					{announcement.body}
				</p>
				<div className="mt-2 flex flex-wrap items-center gap-2">
					<TargetBadge
						targetType={announcement.targetType}
						targetLabel={targetLabel}
					/>
					{statusVisible && (
						<Badge
							variant={announcement.status === 'draft' ? 'secondary' : 'default'}
						>
							{announcement.status === 'draft' ? 'Borrador' : 'Publicado'}
						</Badge>
					)}
					<span className="text-xs text-muted-foreground">
						{announcement.authorName} · {formatRelative(announcement.createdAt)}
					</span>
				</div>
			</div>
		</button>
	);
}
