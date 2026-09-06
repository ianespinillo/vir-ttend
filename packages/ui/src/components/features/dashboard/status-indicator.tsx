'use client';

import { COURSE_RISK_STATUS } from '@repo/common';
import { cn } from '../../../lib/utils';

export interface StatusIndicatorProps {
	status: COURSE_RISK_STATUS;
	size?: 'sm' | 'md' | 'lg';
	className?: string;
}

const STATUS_COLORS: Record<COURSE_RISK_STATUS, string> = {
	[COURSE_RISK_STATUS.OK]: 'bg-emerald-500',
	[COURSE_RISK_STATUS.WARNING]: 'bg-amber-500',
	[COURSE_RISK_STATUS.CRITICAL]: 'bg-rose-500',
};

const STATUS_LABELS: Record<COURSE_RISK_STATUS, string> = {
	[COURSE_RISK_STATUS.OK]: 'Normal',
	[COURSE_RISK_STATUS.WARNING]: 'En riesgo',
	[COURSE_RISK_STATUS.CRITICAL]: 'Crítico',
};

const SIZE_CLASSES = {
	sm: 'h-2.5 w-2.5',
	md: 'h-3.5 w-3.5',
	lg: 'h-5 w-5',
};

export function StatusIndicator({
	status,
	size = 'md',
	className,
}: Readonly<StatusIndicatorProps>) {
	return (
		<span
			className={cn(
				'inline-block rounded-full',
				STATUS_COLORS[status],
				SIZE_CLASSES[size],
				className,
			)}
			title={STATUS_LABELS[status]}
		/>
	);
}
