'use client';

import type {
	AttendanceMetrics,
	AttendanceRecord,
	AttendanceStatus,
	ICourseResponse,
} from '@repo/common';
import { PageHeader } from '../../shared/page-header';
import { AttendanceGrid } from './attendance-grid/attendance-grid';
import type { StudentRowItem } from './attendance-grid/attendance-row';
import { AttendanceSummary } from './attendance-summary/attendance-summary';
import { AttendanceToolbar } from './attendance-toolbar/attendance-toolbar';
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
					/>
				</>
			)}

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
