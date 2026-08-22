'use client';

import type { AlertType } from '@repo/common';
import { cn } from '../../../lib/utils';
import { Badge } from '../../../ui/badge';

export interface AlertTypeBadgeProps {
	alertType: AlertType;
	className?: string;
}

const ALERT_STYLES: Record<AlertType, string> = {
	warning:
		'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700',
	critical:
		'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700',
	exceeded:
		'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-700',
};

const ALERT_LABELS: Record<AlertType, string> = {
	warning: 'Advertencia',
	critical: 'Crítico',
	exceeded: 'Excedido',
};

export function AlertTypeBadge({
	alertType,
	className,
}: Readonly<AlertTypeBadgeProps>) {
	return (
		<Badge
			variant="outline"
			className={cn('text-xs font-medium', ALERT_STYLES[alertType], className)}
		>
			{ALERT_LABELS[alertType]}
		</Badge>
	);
}
