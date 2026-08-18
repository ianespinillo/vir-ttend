'use client';

import type {
	AttendanceMetrics,
	AttendanceRecord,
	AttendanceStatus,
	ISubjectResponse,
} from '@repo/common';
import { AlertCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { PageHeader } from '../../shared/page-header';
import { AttendanceGrid } from './attendance-grid/attendance-grid';
import type { StudentRowItem } from './attendance-grid/attendance-row';
import { AttendanceSummary } from './attendance-summary/attendance-summary';
import { AttendanceToolbar } from './attendance-toolbar/attendance-toolbar';
import { CopyAttendanceModal } from './copy-attendance-modal';
import { JustificationModal } from './justification-modal/justification-modal';

export interface SubjectAttendancePageProps {
	subjects: ISubjectResponse[];
	gridStudents: StudentRowItem[];
	metrics: AttendanceMetrics | null;
	selectedSubjectId: string;
	selectedDate: string;
	selectedSubjectName?: string;
	isClassDay: boolean;
	isLoadingSubjects: boolean;
	isLoadingAttendance: boolean;
	isSaving: boolean;
	isBulkSaving: boolean;
	onSubjectChange: (subjectId: string) => void;
	onDateChange: (date: string) => void;
	onStatusChange: (studentId: string, status: AttendanceStatus) => void;
	onMarkAll: (status: AttendanceStatus) => void;
	isCopyOpen: boolean;
	onOpenCopy: () => void;
	onCloseCopy: () => void;
	onConfirmCopy: () => Promise<void>;
	isSubmittingCopy: boolean;
	isJustifyOpen: boolean;
	selectedRecordToJustify: AttendanceRecord | null;
	onJustify: (record: AttendanceRecord) => void;
	onCloseJustify: () => void;
	onConfirmJustify: (reason: string, notes?: string) => Promise<void>;
	isSubmittingJustify: boolean;
	extraActions?: ReactNode;
}

export function SubjectAttendancePage({
	subjects,
	gridStudents,
	metrics,
	selectedSubjectId,
	selectedDate,
	selectedSubjectName,
	isClassDay,
	isLoadingSubjects,
	isLoadingAttendance,
	isSaving,
	isBulkSaving,
	onSubjectChange,
	onDateChange,
	onStatusChange,
	onMarkAll,
	isCopyOpen,
	onCloseCopy,
	onConfirmCopy,
	isSubmittingCopy,
	isJustifyOpen,
	selectedRecordToJustify,
	onJustify,
	onCloseJustify,
	onConfirmJustify,
	isSubmittingJustify,
	extraActions,
}: SubjectAttendancePageProps) {
	return (
		<div className="space-y-6">
			<PageHeader
				title="Asistencia por Materia"
				description="Panel del docente para tomar asistencia y gestionar ausencias por materia"
			/>

			<AttendanceToolbar
				subjects={subjects}
				selectedSubjectId={selectedSubjectId}
				onSubjectChange={onSubjectChange}
				selectedDate={selectedDate}
				onDateChange={onDateChange}
				onMarkAll={onMarkAll}
				isLoadingSubjects={isLoadingSubjects}
				isBulkSaving={isBulkSaving}
				disabled={!selectedSubjectId}
				extraActions={extraActions}
			/>

			{!isClassDay && (
				<div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-900 dark:text-amber-200 text-xs">
					<AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
					<span>
						<strong>Advertencia:</strong> La materia{' '}
						<strong>{selectedSubjectName}</strong> no tiene clase agendada para el día
						seleccionado. El registro está deshabilitado.
					</span>
				</div>
			)}

			{selectedSubjectId && (
				<>
					<AttendanceSummary metrics={metrics} isLoading={isLoadingAttendance} />

					<AttendanceGrid
						students={gridStudents}
						onStatusChange={onStatusChange}
						onJustify={onJustify}
						isLoading={isLoadingAttendance}
						isSaving={isSaving || !isClassDay}
					/>
				</>
			)}

			<CopyAttendanceModal
				isOpen={isCopyOpen}
				onClose={onCloseCopy}
				subjectName={selectedSubjectName}
				targetDate={selectedDate}
				onConfirm={onConfirmCopy}
				isSubmitting={isSubmittingCopy}
			/>

			<JustificationModal
				isOpen={isJustifyOpen}
				onClose={onCloseJustify}
				studentName={selectedRecordToJustify?.studentName}
				onConfirm={onConfirmJustify}
				isSubmitting={isSubmittingJustify}
			/>
		</div>
	);
}
