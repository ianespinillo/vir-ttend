'use client';

import type {
	AttendanceRecord,
	AttendanceStatus,
	MyWorkshopCommission,
} from '@repo/common';
import { FileText, Wrench } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../ui/button';
import { Skeleton } from '../../../ui/skeleton';
import { EmptyState } from '../../shared/empty-state';
import { PageHeader } from '../../shared/page-header';
import { AttendanceGrid } from './attendance-grid/attendance-grid';
import type { StudentRowItem } from './attendance-grid/attendance-row';
import { AttendanceDatePicker } from './attendance-toolbar/date-picker';
import { QuickActions } from './attendance-toolbar/quick-actions';
import { JustificationModal } from './justification-modal/justification-modal';

export function formatCommissionLabel(
	commission: Pick<MyWorkshopCommission, 'courseName' | 'code'>,
): string {
	return `${commission.courseName} · Comisión ${commission.code}`;
}

export interface WorkshopAttendancePageProps {
	commissions: MyWorkshopCommission[];
	gridStudents: StudentRowItem[];
	selectedCommissionId: string;
	selectedDate: string;
	isLoadingCommissions: boolean;
	isLoadingAttendance: boolean;
	isSaving: boolean;
	onCommissionChange: (commissionId: string) => void;
	onDateChange: (date: string) => void;
	onStatusChange: (studentId: string, status: AttendanceStatus) => void;
	onMarkAll: (status: AttendanceStatus) => void;
	onConfirmChanges: () => void;
	onResetChanges: () => void;
	onJustify?: (record: AttendanceRecord) => void;
	isJustifyOpen?: boolean;
	selectedRecordToJustify?: AttendanceRecord | null;
	onCloseJustify?: () => void;
	onConfirmJustify?: (reason: string, notes?: string) => Promise<void>;
	isSubmittingJustify?: boolean;
	/** Bulk justification (optional): ids of the selected saved records. */
	selectedRecordIds?: ReadonlySet<string>;
	onToggleSelect?: (recordId: string) => void;
	onToggleSelectAll?: (recordIds: string[], selected: boolean) => void;
	onBulkJustify?: () => void;
	/** Set while the justification modal is open in bulk mode. */
	bulkJustifyCount?: number;
}

export function WorkshopAttendancePage({
	commissions,
	gridStudents,
	selectedCommissionId,
	selectedDate,
	isLoadingCommissions,
	isLoadingAttendance,
	isSaving,
	onCommissionChange,
	onDateChange,
	onStatusChange,
	onMarkAll,
	onConfirmChanges,
	onResetChanges,
	onJustify,
	isJustifyOpen = false,
	selectedRecordToJustify = null,
	onCloseJustify,
	onConfirmJustify,
	isSubmittingJustify = false,
	selectedRecordIds,
	onToggleSelect,
	onToggleSelectAll,
	onBulkJustify,
	bulkJustifyCount,
}: Readonly<WorkshopAttendancePageProps>) {
	const selectedCount = selectedRecordIds?.size ?? 0;
	const selected = commissions.find(
		(c) => c.commissionId === selectedCommissionId,
	);

	return (
		<div className="space-y-6">
			<PageHeader
				title="Asistencia de taller"
				description="Registro de asistencia de taller por comisión"
			/>

			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between p-4 bg-card/60 backdrop-blur-md rounded-xl border border-border/80 shadow-xs">
				<AttendanceDatePicker
					selectedDate={selectedDate}
					onDateChange={onDateChange}
				/>
				{selected && (
					<QuickActions onMarkAll={onMarkAll} disabled={isSaving || !selected} />
				)}
			</div>

			<section className="space-y-3">
				<h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
					Mis comisiones
				</h2>
				{isLoadingCommissions ? (
					<div className="flex flex-wrap gap-3">
						<Skeleton className="h-16 w-64 rounded-xl" />
						<Skeleton className="h-16 w-64 rounded-xl" />
					</div>
				) : commissions.length === 0 ? (
					<EmptyState
						icon={<Wrench className="h-6 w-6" />}
						title="Sin comisiones asignadas"
						description="No tenés comisiones de taller asignadas."
					/>
				) : (
					<div className="flex flex-wrap gap-3">
						{commissions.map((commission) => (
							<button
								key={commission.commissionId}
								type="button"
								onClick={() => onCommissionChange(commission.commissionId)}
								aria-pressed={commission.commissionId === selectedCommissionId}
								className={cn(
									'flex flex-col items-start gap-1 rounded-xl border bg-card px-4 py-3 text-left shadow-xs transition-colors hover:border-primary/50',
									commission.commissionId === selectedCommissionId
										? 'border-primary ring-1 ring-primary'
										: 'border-border/80',
								)}
							>
								<span className="font-semibold text-sm text-foreground">
									{formatCommissionLabel(commission)}
								</span>
								<span className="text-xs text-muted-foreground">
									{commission.hasWorkshopToday
										? 'Hay taller este día'
										: 'Sin taller este día'}
								</span>
							</button>
						))}
					</div>
				)}
			</section>

			{selected && (
				<>
					{!selected.hasWorkshopToday && (
						<output className="block rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
							Esta comisión no tiene taller programado este día. Podés registrar la
							asistencia igualmente si el taller se dictó.
						</output>
					)}

					<AttendanceGrid
						students={gridStudents}
						onStatusChange={onStatusChange}
						onJustify={onJustify}
						isLoading={isLoadingAttendance}
						isSaving={isSaving}
						selectedRecordIds={selectedRecordIds}
						onToggleSelect={onToggleSelect}
						onToggleSelectAll={onToggleSelectAll}
					/>

					<div className="flex items-center justify-end gap-2">
						{selectedCount > 0 && onBulkJustify && (
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={onBulkJustify}
								disabled={isSaving}
							>
								<FileText className="mr-1.5 h-4 w-4 shrink-0" />
								Justificar seleccionados ({selectedCount})
							</Button>
						)}
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={onResetChanges}
							disabled={isSaving}
						>
							Cancelar
						</Button>
						<Button
							type="button"
							size="sm"
							onClick={onConfirmChanges}
							disabled={isSaving || gridStudents.length === 0}
						>
							{isSaving ? 'Guardando...' : 'Confirmar'}
						</Button>
					</div>
				</>
			)}

			{onJustify && onCloseJustify && onConfirmJustify && (
				<JustificationModal
					isOpen={isJustifyOpen}
					onClose={onCloseJustify}
					studentName={selectedRecordToJustify?.studentName}
					studentCount={bulkJustifyCount}
					onConfirm={onConfirmJustify}
					isSubmitting={isSubmittingJustify}
				/>
			)}
		</div>
	);
}
