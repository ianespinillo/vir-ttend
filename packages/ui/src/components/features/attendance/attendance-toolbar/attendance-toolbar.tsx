'use client';

import type { AttendanceStatus, ICourseResponse } from '@repo/common';
import type { ReactNode } from 'react';
import { CourseSelector } from './course-selector';
import { AttendanceDatePicker } from './date-picker';
import { QuickActions } from './quick-actions';

export interface AttendanceToolbarProps {
	courses: ICourseResponse[];
	selectedCourseId?: string;
	onCourseChange: (courseId: string) => void;
	selectedDate: string;
	onDateChange: (date: string) => void;
	onMarkAll: (status: AttendanceStatus) => void;
	isLoadingCourses?: boolean;
	isBulkSaving?: boolean;
	extraActions?: ReactNode;
	disabled?: boolean;
}

export function AttendanceToolbar({
	courses,
	selectedCourseId,
	onCourseChange,
	selectedDate,
	onDateChange,
	onMarkAll,
	isLoadingCourses,
	isBulkSaving,
	extraActions,
	disabled,
}: AttendanceToolbarProps) {
	return (
		<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between p-4 bg-card/60 backdrop-blur-md rounded-xl border border-border/80 shadow-xs">
			<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-wrap">
				<CourseSelector
					courses={courses}
					selectedCourseId={selectedCourseId}
					onCourseChange={onCourseChange}
					isLoading={isLoadingCourses}
					disabled={disabled}
				/>
				<AttendanceDatePicker
					selectedDate={selectedDate}
					onDateChange={onDateChange}
					disabled={disabled || !selectedCourseId}
				/>
				{extraActions}
			</div>

			{selectedCourseId && (
				<QuickActions
					onMarkAll={onMarkAll}
					disabled={disabled || isBulkSaving}
					isLoading={isBulkSaving}
				/>
			)}
		</div>
	);
}
