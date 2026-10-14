'use client';

import type { Alert } from '@repo/common';
import { format } from 'date-fns';
import { Eye, User } from 'lucide-react';
import { localizeCourseName } from '../../../lib/shift';
import { Button } from '../../../ui/button';
import { AlertTypeBadge } from './alert-type-badge';

/** Weighted absences move in 0.25 steps: "12,5 faltas", "1 falta". */
function formatAbsenceCount(count: number): string {
	const formatted = count.toLocaleString('es-AR', { maximumFractionDigits: 2 });
	return `${formatted} ${count === 1 ? 'falta' : 'faltas'}`;
}

export interface AlertItemProps {
	alert: Alert;
	onMarkSeen?: (alertId: string) => void;
	onClick?: (alert: Alert) => void;
	isMarking?: boolean;
}

export function AlertItem({
	alert,
	onMarkSeen,
	onClick,
	isMarking,
}: Readonly<AlertItemProps>) {
	const isSeen = alert.seenAt !== null;

	return (
		<div
			className={`flex items-center gap-4 p-4 border-b border-border/50 transition-colors hover:bg-muted/40 ${
				isSeen ? 'opacity-60' : ''
			}`}
		>
			{!isSeen && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}

			<div className="flex items-center gap-2 min-w-0 shrink-0">
				<div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
					<User className="h-4 w-4 text-muted-foreground" />
				</div>
				<div className="min-w-0">
					<p className="text-sm font-medium text-foreground truncate">
						{alert.studentName}
					</p>
					<p className="text-xs text-muted-foreground truncate">
						{localizeCourseName(alert.courseName)}
					</p>
				</div>
			</div>

			<div className="flex items-center gap-3 ml-auto shrink-0">
				<AlertTypeBadge alertType={alert.alertType} />

				<p className="text-sm font-semibold text-foreground tabular-nums w-24 text-right">
					{formatAbsenceCount(alert.absenceCount)}
				</p>

				<p className="text-xs text-muted-foreground w-20 text-right">
					{format(new Date(alert.createdAt), 'dd/MM/yyyy')}
				</p>

				{!isSeen && onMarkSeen && (
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="h-8 w-8 shrink-0"
						onClick={(e) => {
							e.stopPropagation();
							onMarkSeen(alert.id);
						}}
						disabled={isMarking}
						title="Marcar como vista"
					>
						<Eye className="h-4 w-4" />
					</Button>
				)}
			</div>
		</div>
	);
}
