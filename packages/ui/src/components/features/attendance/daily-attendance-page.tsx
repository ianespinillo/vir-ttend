'use client';

import {
	type AttendanceMetrics,
	type AttendanceRecord,
	type AttendanceStatus,
	type ICourseResponse,
	WORKSHOP_ONLY_DAILY_ATTENDANCE_MESSAGE,
	isWorkshopOnlyCourse,
} from '@repo/common';
import { FileText, Wrench } from 'lucide-react';
import { useMemo } from 'react';
import { Button } from '../../../ui/button';
import {
	Empty,
	EmptyContent,
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
	extraActions?: React.ReactNode;
	/** Where the workshop attendance lives, linked from the workshop-only notice. */
	workshopAttendanceHref?: string;
	/** Bulk justification (optional): ids of the selected saved records. */
	selectedRecordIds?: ReadonlySet<string>;
	onToggleSelect?: (recordId: string) => void;
	onToggleSelectAll?: (recordIds: string[], selected: boolean) => void;
	onBulkJustify?: () => void;
	/** Set while the justification modal is open in bulk mode. */
	bulkJustifyCount?: number;
}

/**
 * Courses that take daily attendance: workshop-only courses (7th year
 * technical) have none, their attendance is the workshop one.
 */
export function filterDailyAttendanceCourses(
	courses: readonly ICourseResponse[],
): ICourseResponse[] {
	return courses.filter((course) => !isWorkshopOnlyCourse(course));
}

function WorkshopOnlyNotice({ href }: Readonly<{ href?: string }>) {
	return (
		<Empty className="my-8 border border-dashed border-border">
			<EmptyHeader>
				<EmptyMedia variant="icon">
					<Wrench className="h-6 w-6" />
				</EmptyMedia>
				<EmptyTitle>Sin asistencia diaria</EmptyTitle>
				<EmptyDescription>
					{WORKSHOP_ONLY_DAILY_ATTENDANCE_MESSAGE}
				</EmptyDescription>
			</EmptyHeader>
			{href && (
				<EmptyContent>
					<Button asChild variant="outline">
						<a href={href}>Ir a Asistencia de taller</a>
					</Button>
				</EmptyContent>
			)}
		</Empty>
	);
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
	extraActions,
	workshopAttendanceHref,
	selectedRecordIds,
	onToggleSelect,
	onToggleSelectAll,
	onBulkJustify,
	bulkJustifyCount,
}: Readonly<DailyAttendancePageProps>) {
	const dailyCourses = useMemo(
		() => filterDailyAttendanceCourses(courses),
		[courses],
	);
	const selectedIsWorkshopOnly = useMemo(() => {
		const selected = courses.find((course) => course.id === selectedCourseId);
		return selected ? isWorkshopOnlyCourse(selected) : false;
	}, [courses, selectedCourseId]);
	const selectedCount = selectedRecordIds?.size ?? 0;
	const hasDailyCourse = Boolean(selectedCourseId) && !selectedIsWorkshopOnly;

	return (
		<div className="space-y-6">
			<PageHeader
				title="Asistencia Diaria"
				description="Panel de registro y control de asistencia diaria por curso"
			/>

			<AttendanceToolbar
				courses={dailyCourses}
				selectedCourseId={selectedCourseId}
				onCourseChange={onCourseChange}
				selectedDate={selectedDate}
				onDateChange={onDateChange}
				onMarkAll={onMarkAll}
				isLoadingCourses={isLoadingCourses}
				isBulkSaving={isBulkSaving}
				disabled={!hasDailyCourse}
				extraActions={hasDailyCourse ? extraActions : undefined}
			/>

			{selectedIsWorkshopOnly && (
				<WorkshopOnlyNotice href={workshopAttendanceHref} />
			)}

			{hasDailyCourse && (
				<>
					<AttendanceSummary metrics={metrics} isLoading={isLoadingMetrics} />

					<div data-tour="attendance-grid">
						<AttendanceGrid
							students={gridStudents}
							onStatusChange={onStatusChange}
							onJustify={onJustify}
							isLoading={isLoadingDaily}
							isSaving={isSaving}
							selectedRecordIds={selectedRecordIds}
							onToggleSelect={onToggleSelect}
							onToggleSelectAll={onToggleSelectAll}
						/>
					</div>

					<div
						data-tour="attendance-confirm-actions"
						className="flex items-center justify-end gap-2"
					>
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
							disabled={isSaving}
						>
							{isSaving ? 'Guardando...' : 'Confirmar'}
						</Button>
					</div>
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
				studentCount={bulkJustifyCount}
				onConfirm={onConfirmJustify}
				isSubmitting={isSubmittingJustify}
			/>
		</div>
	);
}
