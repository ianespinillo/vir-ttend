'use client';

import type { AttendanceRecord, ISubjectResponse } from '@repo/common';
import { BookOpen } from 'lucide-react';
import { formatPercent } from '../../../../lib/format';
import { buildSubjectBreakdown } from '../../../../lib/student-history';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../ui/card';
import { Skeleton } from '../../../../ui/skeleton';
import { EmptyState } from '../../../shared/empty-state';

export interface StudentSubjectBreakdownProps {
	records: AttendanceRecord[];
	subjects: ISubjectResponse[];
	isLoading?: boolean;
}

export function StudentSubjectBreakdown({
	records,
	subjects,
	isLoading,
}: StudentSubjectBreakdownProps) {
	const rows = buildSubjectBreakdown(records, subjects);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-base">
					<BookOpen className="h-4 w-4 text-primary" />
					Asistencia por materia
				</CardTitle>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<Skeleton className="h-48 w-full animate-pulse rounded-lg" />
				) : rows.length === 0 ? (
					<EmptyState
						icon={<BookOpen className="h-10 w-10 text-muted-foreground" />}
						title="Sin registros de asistencia"
						description="Todavía no hay asistencias registradas para este alumno en el ciclo lectivo."
					/>
				) : (
					<ul className="divide-y divide-border">
						{rows.map((row) => (
							<li
								key={row.key}
								className="flex items-center justify-between gap-4 py-3"
							>
								<div className="min-w-0">
									<p className="truncate text-sm font-medium">{row.name}</p>
									<p className="text-xs text-muted-foreground">
										P {row.present} · A {row.absent} · T {row.late} · J {row.justified}
									</p>
								</div>
								<span className="shrink-0 text-sm font-semibold tabular-nums">
									{formatPercent(row.attendancePercent)}
								</span>
							</li>
						))}
					</ul>
				)}
			</CardContent>
		</Card>
	);
}
