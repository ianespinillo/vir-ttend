'use client';

import type { AnnouncementTargetType } from '@repo/common';
import { Badge } from '../../../ui/badge';

export interface TargetBadgeProps {
	targetType: AnnouncementTargetType;
	targetLabel?: string;
}

const TARGET_LABELS: Record<AnnouncementTargetType, string> = {
	school: 'Toda la escuela',
	level: 'Dirigido',
	course: 'Dirigido',
};

export function TargetBadge({
	targetType,
	targetLabel,
}: Readonly<TargetBadgeProps>) {
	return (
		<Badge variant="outline" className="gap-1 font-normal">
			{targetLabel ?? TARGET_LABELS[targetType]}
		</Badge>
	);
}
