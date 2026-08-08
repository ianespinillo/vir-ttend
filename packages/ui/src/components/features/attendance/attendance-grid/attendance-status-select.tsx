'use client';

import { ATTENDANCE_STATUS, type AttendanceStatus } from '@repo/common';
import { CheckCircle2, Clock, FileCheck2, XCircle } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../../../../ui/select';

export interface AttendanceStatusSelectProps {
	value?: AttendanceStatus | null;
	onValueChange: (value: AttendanceStatus) => void;
	disabled?: boolean;
}

export function AttendanceStatusSelect({
	value,
	onValueChange,
	disabled,
}: AttendanceStatusSelectProps) {
	const getStatusConfig = (status?: AttendanceStatus | null) => {
		switch (status) {
			case ATTENDANCE_STATUS.PRESENT:
				return {
					label: 'Presente',
					icon: CheckCircle2,
					className:
						'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-medium',
				};
			case ATTENDANCE_STATUS.ABSENT:
				return {
					label: 'Ausente',
					icon: XCircle,
					className:
						'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30 font-medium',
				};
			case ATTENDANCE_STATUS.LATE:
				return {
					label: 'Tarde',
					icon: Clock,
					className:
						'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 font-medium',
				};
			case ATTENDANCE_STATUS.JUSTIFIED:
				return {
					label: 'Justificado',
					icon: FileCheck2,
					className:
						'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/30 font-medium',
				};
			default:
				return {
					label: 'Sin registrar',
					icon: null,
					className: 'text-muted-foreground border-dashed bg-muted/30',
				};
		}
	};

	const config = getStatusConfig(value);
	const Icon = config.icon;

	return (
		<Select
			value={value || ''}
			onValueChange={(val: string) => onValueChange(val as AttendanceStatus)}
			disabled={disabled}
		>
			<SelectTrigger
				className={cn('w-36 h-9 transition-colors border', config.className)}
			>
				<div className="flex items-center gap-1.5 truncate">
					{Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
					<SelectValue placeholder="Sin registrar" />
				</div>
			</SelectTrigger>
			<SelectContent>
				<SelectItem
					key={ATTENDANCE_STATUS.PRESENT}
					value={ATTENDANCE_STATUS.PRESENT}
				>
					<div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-medium">
						<CheckCircle2 className="h-4 w-4 shrink-0" />
						<span>Presente</span>
					</div>
				</SelectItem>
				<SelectItem key={ATTENDANCE_STATUS.ABSENT} value={ATTENDANCE_STATUS.ABSENT}>
					<div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-medium">
						<XCircle className="h-4 w-4 shrink-0" />
						<span>Ausente</span>
					</div>
				</SelectItem>
				<SelectItem key={ATTENDANCE_STATUS.LATE} value={ATTENDANCE_STATUS.LATE}>
					<div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-medium">
						<Clock className="h-4 w-4 shrink-0" />
						<span>Tarde</span>
					</div>
				</SelectItem>
				<SelectItem
					key={ATTENDANCE_STATUS.JUSTIFIED}
					value={ATTENDANCE_STATUS.JUSTIFIED}
				>
					<div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-medium">
						<FileCheck2 className="h-4 w-4 shrink-0" />
						<span>Justificado</span>
					</div>
				</SelectItem>
			</SelectContent>
		</Select>
	);
}
