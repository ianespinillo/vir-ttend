'use client';

import type { AttendanceRecord, AttendanceStatus } from '@repo/common';
import { Card, CardContent } from '../../../../ui/card';
import { Skeleton } from '../../../../ui/skeleton';
import { EmptyState } from '../../../shared/empty-state';
import { AttendanceRow, type StudentRowItem } from './attendance-row';

export interface AttendanceGridProps {
	students: StudentRowItem[];
	onStatusChange: (studentId: string, status: AttendanceStatus) => void;
	onJustify?: (record: AttendanceRecord) => void;
	isLoading?: boolean;
	isSaving?: boolean;
}

export function AttendanceGrid({
	students,
	onStatusChange,
	onJustify,
	isLoading,
	isSaving,
}: AttendanceGridProps) {
	if (isLoading) {
		return (
			<Card className="shadow-xs border border-border/80">
				<CardContent className="p-4 space-y-3">
					{[1, 2, 3, 4, 5, 6].map((item) => (
						<div
							key={item}
							className="flex items-center justify-between py-2 border-b"
						>
							<div className="flex items-center gap-3">
								<Skeleton className="h-8 w-8 rounded-full" />
								<Skeleton className="h-4 w-40" />
							</div>
							<Skeleton className="h-9 w-36 rounded-md" />
						</div>
					))}
				</CardContent>
			</Card>
		);
	}

	if (!students || students.length === 0) {
		return (
			<EmptyState
				title="Sin alumnos en el curso"
				description="No hay estudiantes registrados o matriculados para este curso."
			/>
		);
	}

	return (
		<Card className="shadow-xs border border-border/80 overflow-hidden">
			<CardContent className="p-0">
				<div className="overflow-x-auto">
					<table className="w-full text-left border-collapse">
						<thead>
							<tr className="bg-muted/50 border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
								<th className="py-3 px-4 font-semibold">Alumno</th>
								<th className="py-3 px-4 font-semibold text-center w-48">
									Estado de Asistencia
								</th>
								<th className="py-3 px-4 font-semibold text-right w-44">Acciones</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border/50 bg-card">
							{students.map((student) => (
								<AttendanceRow
									key={student.id}
									student={student}
									onStatusChange={onStatusChange}
									onJustify={onJustify}
									isSaving={isSaving}
								/>
							))}
						</tbody>
					</table>
				</div>
			</CardContent>
		</Card>
	);
}
