'use client';

import {
	getInitialAttendanceDate,
	getScopedAttendanceCourseIds,
	toAttendanceGridStudents,
	toDailyCopyInput,
	toJustifyInput,
} from '@/lib/attendance/attendance-mappings';
import { useDemo } from '@/lib/session/demo-provider';
import {
	ATTENDANCE_STATUS,
	type AttendanceRecord,
	type AttendanceStatus,
} from '@repo/common';
import { DailyAttendancePage } from '@repo/ui';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';

export default function AttendanceDailyPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { state, session, selectors, store } = useDemo();

	const user = session.user;

	// Scoped courses for this role
	const allCourses = selectors.getCourses(state);
	const scopedCourseIds = getScopedAttendanceCourseIds(
		allCourses,
		selectors.getSubjects(state),
		user?.id,
		user?.role,
	);
	const courses =
		scopedCourseIds === undefined
			? allCourses
			: allCourses.filter((c) => scopedCourseIds.includes(c.id));

	const [selectedCourseId, setSelectedCourseId] = useState(
		() => searchParams.get('courseId') || courses[0]?.id || '',
	);
	const [selectedDate, setSelectedDate] = useState(
		() => searchParams.get('date') || getInitialAttendanceDate(),
	);

	const [isJustifyOpen, setIsJustifyOpen] = useState(false);
	const [selectedRecordToJustify, setSelectedRecordToJustify] =
		useState<AttendanceRecord | null>(null);
	const [isCopyOpen, setIsCopyOpen] = useState(false);
	const [copySourceDate, setCopySourceDate] = useState<string | undefined>();

	// Derived data
	const dailyData = selectors.getDailyAttendance(
		state,
		selectedCourseId,
		selectedDate,
	);
	const courseStudents = selectors.getCourseStudents(state, selectedCourseId);
	const gridStudents = toAttendanceGridStudents(
		courseStudents,
		(dailyData?.records ?? []) as Parameters<typeof toAttendanceGridStudents>[1],
	);
	const metrics = dailyData?.metrics ?? null;

	// Preview for copy modal
	const previewData = copySourceDate
		? selectors.getDailyAttendance(state, selectedCourseId, copySourceDate)
		: undefined;
	const previewRecords = previewData?.records as AttendanceRecord[] | undefined;

	// URL sync
	const updateUrl = useCallback(
		(courseId: string, date: string) => {
			const params = new URLSearchParams(searchParams.toString());
			params.set('courseId', courseId);
			params.set('date', date);
			router.replace(`/attendance/daily?${params.toString()}`);
		},
		[router, searchParams],
	);

	const handleCourseChange = useCallback(
		(courseId: string) => {
			setSelectedCourseId(courseId);
			updateUrl(courseId, selectedDate);
		},
		[selectedDate, updateUrl],
	);

	const handleDateChange = useCallback(
		(date: string) => {
			setSelectedDate(date);
			updateUrl(selectedCourseId, date);
		},
		[selectedCourseId, updateUrl],
	);

	// Attendance mutations — applied directly to the store (synchronous)
	const handleStatusChange = useCallback(
		(studentId: string, status: AttendanceStatus) => {
			store.markDailyAttendance(selectedCourseId, selectedDate, [
				{ studentId, status },
			]);
		},
		[store, selectedCourseId, selectedDate],
	);

	const handleMarkAll = useCallback(
		(status: AttendanceStatus) => {
			const entries = courseStudents.map((s) => ({
				studentId: s.id,
				status,
			}));
			store.markDailyAttendance(selectedCourseId, selectedDate, entries);
		},
		[store, courseStudents, selectedCourseId, selectedDate],
	);

	// Justify
	const handleOpenJustify = useCallback((record: AttendanceRecord) => {
		setSelectedRecordToJustify(record);
		setIsJustifyOpen(true);
	}, []);

	const handleCloseJustify = useCallback(() => {
		setIsJustifyOpen(false);
		setSelectedRecordToJustify(null);
	}, []);

	const handleConfirmJustify = useCallback(
		async (reason: string, notes?: string) => {
			if (!selectedRecordToJustify?.id) return;
			store.justifyAttendance(
				selectedRecordToJustify.id,
				toJustifyInput(reason, notes),
			);
			handleCloseJustify();
		},
		[store, selectedRecordToJustify, handleCloseJustify],
	);

	// Copy
	const handleOpenCopy = useCallback(() => {
		setCopySourceDate(undefined);
		setIsCopyOpen(true);
	}, []);

	const handleCloseCopy = useCallback(() => {
		setIsCopyOpen(false);
		setCopySourceDate(undefined);
	}, []);

	const handleSourceDateChange = useCallback((date: string) => {
		setCopySourceDate(date);
	}, []);

	const handleConfirmCopy = useCallback(
		async (sourceDate?: string) => {
			if (!selectedCourseId || !selectedDate) return;
			store.copyAttendance(
				toDailyCopyInput(selectedCourseId, selectedDate, sourceDate),
			);
			handleCloseCopy();
		},
		[store, selectedCourseId, selectedDate, handleCloseCopy],
	);

	// No-ops: in the demo the store is always in sync — no pending changes to confirm or reset.
	const handleConfirmChanges = useCallback(() => {}, []);
	const handleResetChanges = useCallback(() => {}, []);

	return (
		<DailyAttendancePage
			courses={courses}
			gridStudents={gridStudents}
			metrics={metrics}
			selectedCourseId={selectedCourseId}
			selectedDate={selectedDate}
			isLoadingCourses={false}
			isLoadingDaily={false}
			isLoadingMetrics={false}
			isSaving={false}
			isBulkSaving={false}
			onCourseChange={handleCourseChange}
			onDateChange={handleDateChange}
			onStatusChange={handleStatusChange}
			onMarkAll={handleMarkAll}
			onJustify={handleOpenJustify}
			isJustifyOpen={isJustifyOpen}
			selectedRecordToJustify={selectedRecordToJustify}
			onCloseJustify={handleCloseJustify}
			onConfirmJustify={handleConfirmJustify}
			isSubmittingJustify={false}
			isCopyOpen={isCopyOpen}
			onOpenCopy={handleOpenCopy}
			onCloseCopy={handleCloseCopy}
			onSourceDateChange={handleSourceDateChange}
			copySourceDate={copySourceDate}
			previewRecords={previewRecords}
			isLoadingPreview={false}
			onConfirmCopy={handleConfirmCopy}
			isSubmittingCopy={false}
			onConfirmChanges={handleConfirmChanges}
			onResetChanges={handleResetChanges}
		/>
	);
}
