'use client';

import {
	type AttendanceMetrics,
	type AttendanceRecord,
	type AttendanceStatus,
	type ISubjectResponse,
	WORKSHOP_SHIFT_THEORY_SUBJECT_ATTENDANCE_MESSAGE,
} from '@repo/common';
import { AlertCircle, Wrench } from 'lucide-react';
import type { ReactNode } from 'react';
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from '../../../ui/empty';
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
	onSourceDateChange?: (date: string) => void;
	copySourceDate?: string;
	previewRecords?: AttendanceRecord[];
	isLoadingPreview?: boolean;
	onConfirmCopy: (sourceDate?: string) => Promise<void>;
	isSubmittingCopy: boolean;
	isJustifyOpen: boolean;
	selectedRecordToJustify: AttendanceRecord | null;
	onJustify: (record: AttendanceRecord) => void;
	onCloseJustify: () => void;
	onConfirmJustify: (reason: string, notes?: string) => Promise<void>;
	isSubmittingJustify: boolean;
	extraActions?: ReactNode;
}

/**
 * Subjects offered for per-subject attendance: theory subjects of a
 * workshop-only course (7th year technical) are excluded, their attendance is
 * the workshop one. A missing flag counts as true.
 */
export function filterSubjectsWithAttendance(
	subjects: readonly ISubjectResponse[],
): ISubjectResponse[] {
	return subjects.filter((subject) => subject.hasSubjectAttendance !== false);
}

function NoSubjectAttendanceNotice() {
	return (
		<Empty className="my-8 border border-dashed border-border">
			<EmptyHeader>
				<EmptyMedia variant="icon">
					<Wrench className="h-6 w-6" />
				</EmptyMedia>
				<EmptyTitle>Sin asistencia por materia</EmptyTitle>
				<EmptyDescription>
					{WORKSHOP_SHIFT_THEORY_SUBJECT_ATTENDANCE_MESSAGE}
				</EmptyDescription>
			</EmptyHeader>
		</Empty>
	);
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
	onSourceDateChange,
	copySourceDate,
	previewRecords,
	isLoadingPreview,
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
	const offeredSubjects = filterSubjectsWithAttendance(subjects);
	const selectedHasNoAttendance =
		subjects.find((subject) => subject.id === selectedSubjectId)
			?.hasSubjectAttendance === false;
	const showAttendance = Boolean(selectedSubjectId) && !selectedHasNoAttendance;
	return (
		<div className="space-y-6">
			<PageHeader
				title="Asistencia por Materia"
				description="Panel del docente para tomar asistencia y gestionar ausencias por materia"
			/>

			<AttendanceToolbar
				subjects={offeredSubjects}
				selectedSubjectId={selectedSubjectId}
				onSubjectChange={onSubjectChange}
				selectedDate={selectedDate}
				onDateChange={onDateChange}
				onMarkAll={onMarkAll}
				isLoadingSubjects={isLoadingSubjects}
				isBulkSaving={isBulkSaving}
				disabled={!showAttendance}
				extraActions={showAttendance ? extraActions : undefined}
			/>

			{selectedHasNoAttendance && <NoSubjectAttendanceNotice />}

			{showAttendance && !isClassDay && (
				<div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-900 dark:text-amber-200 text-xs">
					<AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
					<span>
						<strong>Advertencia:</strong> La materia{' '}
						<strong>{selectedSubjectName}</strong> no tiene clase agendada para el día
						seleccionado. El registro está deshabilitado.
					</span>
				</div>
			)}

			{showAttendance && (
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
				sourceDate={copySourceDate}
				onSourceDateChange={onSourceDateChange}
				previewRecords={previewRecords}
				isLoadingPreview={isLoadingPreview}
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
