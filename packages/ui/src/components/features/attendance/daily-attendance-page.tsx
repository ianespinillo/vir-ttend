'use client';

import type {
	AttendanceMetrics,
	AttendanceRecord,
	AttendanceStatus,
	ICourseResponse,
} from '@repo/common';
import { Button } from '../../../ui/button';
import { PageHeader } from '../../shared/page-header';
import { AttendanceGrid } from './attendance-grid/attendance-grid';
import type { StudentRowItem } from './attendance-grid/attendance-row';
import { AttendanceSummary } from './attendance-summary/attendance-summary';
import { AttendanceToolbar } from './attendance-toolbar/attendance-toolbar';
import { CopyAttendanceModal } from './copy-attendance-modal';
import { JustificationModal } from './justification-modal/justification-modal';

export interface DailyAttendancePageProps {
	courses: ICourseResponse[];
	gridStudents: StudentRowItem[];
	metrics: AttendanceMetrics | null;
	selectedCourseId: string;
	selectedDate: string;
	isLoadingCourses: boolean;
	isLoadingDaily: boolean;
	isLoadingMetrics: boolean;
	isSaving: boolean;
	isBulkSaving: boolean;
	onCourseChange: (courseId: string) => void;
	onDateChange: (date: string) => void;
	onStatusChange: (studentId: string, status: AttendanceStatus) => void;
	onMarkAll: (status: AttendanceStatus) => void;
	onJustify: (record: AttendanceRecord) => void;
	isJustifyOpen: boolean;
	selectedRecordToJustify: AttendanceRecord | null;
	onCloseJustify: () => void;
	onConfirmJustify: (reason: string, notes?: string) => Promise<void>;
	isSubmittingJustify: boolean;
	isCopyOpen: boolean;
	onOpenCopy: () => void;
	onCloseCopy: () => void;
	onSourceDateChange?: (date: string) => void;
	copySourceDate?: string;
	previewRecords?: AttendanceRecord[];
	isLoadingPreview?: boolean;
	onConfirmCopy: (sourceDate?: string) => Promise<void>;
	isSubmittingCopy: boolean;
	onConfirmChanges?: () => void;
	onResetChanges?: () => void;
	hasPendingChanges?: boolean;
	extraActions?: React.ReactNode;
}

export function DailyAttendancePage({
	courses,
	gridStudents,
	metrics,
	selectedCourseId,
	selectedDate,
	isLoadingCourses,
	isLoadingDaily,
	isLoadingMetrics,
	isSaving,
	isBulkSaving,
	onCourseChange,
	onDateChange,
	onStatusChange,
	onMarkAll,
	onJustify,
	isJustifyOpen,
	selectedRecordToJustify,
	onCloseJustify,
	onConfirmJustify,
	isSubmittingJustify,
	isCopyOpen,
	onOpenCopy,
	onCloseCopy,
	onSourceDateChange,
	copySourceDate,
	previewRecords,
	isLoadingPreview,
	onConfirmCopy,
	isSubmittingCopy,
	onConfirmChanges,
	onResetChanges,
	hasPendingChanges,
	extraActions,
}: Readonly<DailyAttendancePageProps>) {
	return (
		<div className="space-y-6">
			<PageHeader
				title="Asistencia Diaria"
				description="Panel de registro y control de asistencia diaria por curso"
			/>

			<AttendanceToolbar
				courses={courses}
				selectedCourseId={selectedCourseId}
				onCourseChange={onCourseChange}
				selectedDate={selectedDate}
				onDateChange={onDateChange}
				onMarkAll={onMarkAll}
				isLoadingCourses={isLoadingCourses}
				isBulkSaving={isBulkSaving}
				disabled={!selectedCourseId}
				extraActions={extraActions}
			/>

			{selectedCourseId && (
				<>
					<AttendanceSummary metrics={metrics} isLoading={isLoadingMetrics} />

					<AttendanceGrid
						students={gridStudents}
						onStatusChange={onStatusChange}
						onJustify={onJustify}
						isLoading={isLoadingDaily}
						isSaving={isSaving}
						onConfirmChanges={onConfirmChanges}
						onResetChanges={onResetChanges}
						hasPendingChanges={hasPendingChanges}
					/>

					{hasPendingChanges && (
						<div className="flex items-center justify-end gap-2">
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={onResetChanges}
								disabled={isSaving}
							>
								Deshacer cambios
							</Button>
							<Button
								type="button"
								size="sm"
								onClick={onConfirmChanges}
								disabled={isSaving}
							>
								{isSaving ? 'Guardando...' : 'Confirmar asistencia'}
							</Button>
						</div>
					)}
				</>
			)}

			<CopyAttendanceModal
				isOpen={isCopyOpen}
				onClose={onCloseCopy}
				subjectName="el curso"
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
