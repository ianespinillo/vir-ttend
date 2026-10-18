'use client';

import type { AttendanceRecord, ISubjectResponse } from '@repo/common';
import { History } from 'lucide-react';
import { formatDate } from '../../../../lib/format';
import {
	ATTENDANCE_STATUS_META,
	DAILY_SUBJECT_LABEL,
	UNKNOWN_SUBJECT_LABEL,
	buildSubjectNameMap,
	sortRecordsDesc,
} from '../../../../lib/student-history';
import { Badge } from '../../../../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../ui/card';
import { Skeleton } from '../../../../ui/skeleton';
import { EmptyState } from '../../../shared/empty-state';

export interface StudentAttendanceHistoryProps {
	records: AttendanceRecord[];
	subjects: ISubjectResponse[];
	isLoading?: boolean;
}

function subjectLabel(
	subjectId: string | undefined,
	nameById: Map<string, string>,
): string {
	if (!subjectId) return DAILY_SUBJECT_LABEL;
	return nameById.get(subjectId) ?? UNKNOWN_SUBJECT_LABEL;
}

export function StudentAttendanceHistory({
	records,
	subjects,
	isLoading,
}: StudentAttendanceHistoryProps) {
	const rows = sortRecordsDesc(records);
	const nameById = buildSubjectNameMap(subjects);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-base">
					<History className="h-4 w-4 text-primary" />
					Historial de asistencia
				</CardTitle>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<Skeleton className="h-48 w-full animate-pulse rounded-lg" />
				) : rows.length === 0 ? (
					<EmptyState
						icon={<History className="h-10 w-10 text-muted-foreground" />}
						title="Sin historial"
						description="Todavía no hay asistencias registradas para este alumno en el ciclo lectivo."
					/>
				) : (
					<div className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
						{rows.map((record) => {
							const meta = ATTENDANCE_STATUS_META[record.status];
							return (
								<div
									key={record.id}
									className="flex items-start justify-between gap-4 rounded-lg border p-3"
								>
									<div className="min-w-0">
										<p className="text-sm font-medium">
											{record.date ? formatDate(record.date) : '—'}
										</p>
										<p className="truncate text-xs text-muted-foreground">
											{subjectLabel(record.subjectId, nameById)}
										</p>
										{record.justification && (
											<p className="mt-1 text-xs text-muted-foreground">
												Justificación: {record.justification.reason}
											</p>
										)}
									</div>
									<Badge variant="outline" className={meta.className}>
										{meta.label}
									</Badge>
								</div>
							);
						})}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
