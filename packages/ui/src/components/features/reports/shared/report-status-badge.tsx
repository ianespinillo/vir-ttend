'use client';

import type { StudentReportStatus } from '@repo/common';
import {
	REPORT_STATUS_META,
	getStatusTooltip,
} from '../../../../lib/report-format';
import { cn } from '../../../../lib/utils';
import { Badge } from '../../../../ui/badge';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '../../../../ui/tooltip';

export interface ReportStatusBadgeProps {
	status: StudentReportStatus;
	absencePercent?: number;
	className?: string;
}

export function ReportStatusBadge({
	status,
	absencePercent,
	className,
}: ReportStatusBadgeProps) {
	const meta = REPORT_STATUS_META[status];

	return (
		<TooltipProvider delayDuration={200}>
			<Tooltip>
				<TooltipTrigger asChild>
					<span className={cn('inline-flex cursor-default', className)}>
						<Badge variant="outline" className={meta.badgeClass}>
							{meta.label}
						</Badge>
					</span>
				</TooltipTrigger>
				<TooltipContent>
					<p>{getStatusTooltip(status, absencePercent)}</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}
