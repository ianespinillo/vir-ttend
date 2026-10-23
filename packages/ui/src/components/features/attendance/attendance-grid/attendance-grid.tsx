'use client';

import type { AttendanceRecord, AttendanceStatus } from '@repo/common';
import { Card, CardContent } from '../../../../ui/card';
import { Checkbox } from '../../../../ui/checkbox';
import { Skeleton } from '../../../../ui/skeleton';
import { EmptyState } from '../../../shared/empty-state';
import { AttendanceRow, type StudentRowItem } from './attendance-row';
import { isBulkJustifiableRow } from './justifiable-record';

export interface AttendanceGridProps {
	students: StudentRowItem[];
	onStatusChange: (studentId: string, status: AttendanceStatus) => void;
	onJustify?: (record: AttendanceRecord) => void;
	isLoading?: boolean;
	isSaving?: boolean;
	onConfirmChanges?: () => void;
	onResetChanges?: () => void;
	hasPendingChanges?: boolean;
	/** Bulk justification: the selection column shows when selection and toggle are given. */
	selectedRecordIds?: ReadonlySet<string>;
	onToggleSelect?: (recordId: string) => void;
	onToggleSelectAll?: (recordIds: string[], selected: boolean) => void;
}

export function AttendanceGrid({
	students,
	onStatusChange,
	onJustify,
	isLoading,
	isSaving,
	onConfirmChanges,
	onResetChanges,
	hasPendingChanges,
	selectedRecordIds,
	onToggleSelect,
	onToggleSelectAll,
}: AttendanceGridProps) {
	const selectable = Boolean(selectedRecordIds && onToggleSelect);
	const selectableRecordIds = selectable
		? (students ?? []).flatMap((student) =>
				isBulkJustifiableRow(student) && student.attendanceRecord?.id
					? [student.attendanceRecord.id]
					: [],
			)
		: [];
	const selectedCount = selectableRecordIds.filter((id) =>
		selectedRecordIds?.has(id),
	).length;
	const allSelected =
		selectableRecordIds.length > 0 &&
		selectedCount === selectableRecordIds.length;
	let headerChecked: boolean | 'indeterminate' = false;
	if (allSelected) headerChecked = true;
	else if (selectedCount > 0) headerChecked = 'indeterminate';

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
								{selectable && (
									<th className="py-3 px-4 w-10">
										{onToggleSelectAll && (
											<Checkbox
												checked={headerChecked}
												disabled={selectableRecordIds.length === 0}
												onCheckedChange={() =>
													onToggleSelectAll(selectableRecordIds, !allSelected)
												}
												aria-label="Seleccionar todos los justificables"
											/>
										)}
									</th>
								)}
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
									isPending={hasPendingChanges}
									selectable={selectable}
									isSelected={Boolean(
										student.attendanceRecord?.id &&
											selectedRecordIds?.has(student.attendanceRecord.id),
									)}
									onToggleSelect={onToggleSelect}
								/>
							))}
						</tbody>
					</table>
				</div>
			</CardContent>
		</Card>
	);
}
