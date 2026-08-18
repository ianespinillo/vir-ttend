'use client';

import type {
	AttendanceStatus,
	ICourseResponse,
	ISubjectResponse,
} from '@repo/common';
import type { ReactNode } from 'react';
import { SubjectSelector } from '../subject-selector';
import { CourseSelector } from './course-selector';
import { AttendanceDatePicker } from './date-picker';
import { QuickActions } from './quick-actions';

export interface AttendanceToolbarProps {
	courses?: ICourseResponse[];
	selectedCourseId?: string;
	onCourseChange?: (courseId: string) => void;
	subjects?: ISubjectResponse[];
	selectedSubjectId?: string;
	onSubjectChange?: (subjectId: string) => void;
	allowedSubjectIds?: string[];
	selectedDate: string;
	onDateChange: (date: string) => void;
	onMarkAll: (status: AttendanceStatus) => void;
	isLoadingCourses?: boolean;
	isLoadingSubjects?: boolean;
	isBulkSaving?: boolean;
	extraActions?: ReactNode;
	disabled?: boolean;
}

export function AttendanceToolbar({
	courses,
	selectedCourseId,
	onCourseChange,
	subjects,
	selectedSubjectId,
	onSubjectChange,
	allowedSubjectIds,
	selectedDate,
	onDateChange,
	onMarkAll,
	isLoadingCourses,
	isLoadingSubjects,
	isBulkSaving,
	extraActions,
	disabled,
}: AttendanceToolbarProps) {
	const hasActiveSelection = selectedCourseId || selectedSubjectId;

	return (
		<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between p-4 bg-card/60 backdrop-blur-md rounded-xl border border-border/80 shadow-xs">
			<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-wrap">
				{courses && onCourseChange && (
					<CourseSelector
						courses={courses}
						selectedCourseId={selectedCourseId}
						onCourseChange={onCourseChange}
						isLoading={isLoadingCourses}
					/>
				)}
				{subjects && onSubjectChange && (
					<SubjectSelector
						subjects={subjects}
						selectedSubjectId={selectedSubjectId}
						onSubjectChange={onSubjectChange}
						isLoading={isLoadingSubjects}
						allowedSubjectIds={allowedSubjectIds}
					/>
				)}
				<AttendanceDatePicker
					selectedDate={selectedDate}
					onDateChange={onDateChange}
					disabled={disabled || !hasActiveSelection}
				/>
				{extraActions}
			</div>

			{hasActiveSelection && (
				<QuickActions
					onMarkAll={onMarkAll}
					disabled={disabled || isBulkSaving}
					isLoading={isBulkSaving}
				/>
			)}
		</div>
	);
}
