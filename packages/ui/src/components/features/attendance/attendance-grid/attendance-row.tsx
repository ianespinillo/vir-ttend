'use client';

import {
	ATTENDANCE_STATUS,
	type AttendanceRecord,
	type AttendanceStatus,
} from '@repo/common';
import { FileText } from 'lucide-react';
import { Avatar, AvatarFallback } from '../../../../ui/avatar';
import { Badge } from '../../../../ui/badge';
import { Button } from '../../../../ui/button';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '../../../../ui/tooltip';
import { AttendanceStatusSelect } from './attendance-status-select';

export interface StudentRowItem {
	id: string;
	name: string;
	attendanceRecord?: AttendanceRecord;
	originalStatus?: AttendanceStatus;
}

export interface AttendanceRowProps {
	student: StudentRowItem;
	onStatusChange: (studentId: string, status: AttendanceStatus) => void;
	onJustify?: (record: AttendanceRecord) => void;
	isSaving?: boolean;
	isPending?: boolean;
}

export function AttendanceRow({
	student,
	onStatusChange,
	onJustify,
	isSaving,
	isPending,
}: AttendanceRowProps) {
	const currentStatus = student.attendanceRecord?.status;
	const justification = student.attendanceRecord?.justification;
	const hasChanged = isPending && currentStatus !== student.originalStatus;

	const getInitials = (name: string) => {
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.substring(0, 2)
			.toUpperCase();
	};

	const canJustify =
		currentStatus === ATTENDANCE_STATUS.LATE &&
		student.attendanceRecord?.id &&
		onJustify;

	return (
		<tr className="border-b border-border/50 hover:bg-muted/40 transition-colors">
			<td className="py-3 px-4">
				<div className="flex items-center gap-3">
					<Avatar className="h-8 w-8 border border-border">
						<AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
							{getInitials(student.name)}
						</AvatarFallback>
					</Avatar>
					<div className="flex flex-col">
						<span className="font-semibold text-sm text-foreground">
							{student.name}
						</span>
					</div>
				</div>
			</td>
			<td className="py-3 px-4 text-center">
				<div className="flex items-center justify-center gap-2">
					<AttendanceStatusSelect
						value={currentStatus}
						onValueChange={(status) => onStatusChange(student.id, status)}
						disabled={isSaving}
					/>
					{hasChanged && (
						<span
							className="h-2 w-2 rounded-full bg-amber-500 shrink-0"
							title="Cambio pendiente"
						/>
					)}
				</div>
			</td>
			<td className="py-3 px-4 text-right">
				<div className="flex items-center justify-end gap-2">
					{justification ? (
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<Badge
										variant="outline"
										className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/30 gap-1 cursor-help"
									>
										<FileText className="h-3 w-3" />
										Justificado
									</Badge>
								</TooltipTrigger>
								<TooltipContent>
									<p className="font-semibold">{justification.reason}</p>
									{justification.notes && (
										<p className="text-xs text-muted-foreground">{justification.notes}</p>
									)}
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					) : canJustify ? (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={() => {
								if (student.attendanceRecord) {
									onJustify(student.attendanceRecord);
								}
							}}
							className="text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/50"
						>
							<FileText className="mr-1 h-3.5 w-3.5" />
							Justificar
						</Button>
					) : null}
				</div>
			</td>
		</tr>
	);
}
