'use client';

import type { AlertType, StudentReportStatus } from '@repo/common';
import { AlertTriangle, ShieldAlert, ShieldX } from 'lucide-react';
import { REPORT_ALERT_META } from '../../../../lib/report-format';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '../../../../ui/tooltip';
import { ReportStatusBadge } from '../shared';

const ALERT_ICONS: Record<AlertType, typeof AlertTriangle> = {
	warning: AlertTriangle,
	critical: ShieldAlert,
	exceeded: ShieldX,
};

export interface ReportStatusCellProps {
	status: StudentReportStatus;
	absencePercent: number;
	alerts?: { status: AlertType }[];
}

export function ReportStatusCell({
	status,
	absencePercent,
	alerts = [],
}: ReportStatusCellProps) {
	const visibleAlerts = alerts.slice(0, 2);

	return (
		<div className="flex items-center justify-center gap-2">
			<ReportStatusBadge status={status} absencePercent={absencePercent} />
			{visibleAlerts.map((alert, i) => {
				const meta = REPORT_ALERT_META[alert.status];
				if (!meta) return null;
				const Icon = ALERT_ICONS[alert.status];
				return (
					<TooltipProvider key={`${alert.status}-${i}`} delayDuration={200}>
						<Tooltip>
							<TooltipTrigger asChild>
								<span
									className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${meta.iconClass}`}
								>
									<Icon className="h-3.5 w-3.5" />
								</span>
							</TooltipTrigger>
							<TooltipContent>
								<p>{meta.label}</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				);
			})}
		</div>
	);
}
