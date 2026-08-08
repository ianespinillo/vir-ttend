'use client';

import { ATTENDANCE_STATUS, type AttendanceStatus } from '@repo/common';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '../../../../ui/button';

export interface QuickActionsProps {
	onMarkAll: (status: AttendanceStatus) => void;
	disabled?: boolean;
	isLoading?: boolean;
}

export function QuickActions({
	onMarkAll,
	disabled,
	isLoading,
}: QuickActionsProps) {
	return (
		<div className="flex items-center gap-2">
			<Button
				type="button"
				variant="outline"
				size="sm"
				disabled={disabled || isLoading}
				onClick={() => onMarkAll(ATTENDANCE_STATUS.PRESENT)}
				className="border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/10 hover:text-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-500/20 shadow-xs"
			>
				<CheckCircle2 className="mr-1.5 h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
				Todos Presentes
			</Button>
			<Button
				type="button"
				variant="outline"
				size="sm"
				disabled={disabled || isLoading}
				onClick={() => onMarkAll(ATTENDANCE_STATUS.ABSENT)}
				className="border-rose-500/30 text-rose-700 hover:bg-rose-500/10 hover:text-rose-800 dark:text-rose-400 dark:hover:bg-rose-500/20 shadow-xs"
			>
				<XCircle className="mr-1.5 h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
				Todos Ausentes
			</Button>
		</div>
	);
}
