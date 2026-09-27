'use client';

import {
	getInitialAttendanceDate,
	getScopedAttendanceSubjects,
	isClassDay,
	toAttendanceGridStudents,
	toJustifyInput,
	toSubjectCopyInput,
} from '@/lib/attendance/attendance-mappings';
import { useDemo } from '@/lib/session/demo-provider';
import {
	ATTENDANCE_STATUS,
	type AttendanceRecord,
	type AttendanceStatus,
} from '@repo/common';
import { SubjectAttendancePage } from '@repo/ui';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

export default function AttendanceSubjectPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { state, session, selectors, store } = useDemo();

	const user = session.user;

	// Scoped subjects for this role
	const allSubjects = selectors.getSubjects(state);
	const scopedSubjects = getScopedAttendanceSubjects(
		allSubjects,
		user?.id,
		user?.role,
	);

	const [selectedSubjectId, setSelectedSubjectId] = useState(
		() => searchParams.get('subjectId') || scopedSubjects[0]?.id || '',
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
	const subjectData = selectors.getSubjectAttendance(
		state,
		selectedSubjectId,
		selectedDate,
	);
	const selectedSubject = scopedSubjects.find((s) => s.id === selectedSubjectId);
	const courseId = subjectData?.courseId ?? selectedSubject?.courseId ?? '';
	const courseStudents = selectors.getCourseStudents(state, courseId);

	const gridStudents = toAttendanceGridStudents(
		courseStudents,
		(subjectData?.records ?? []) as Parameters<
			typeof toAttendanceGridStudents
		>[1],
	);

	// getSchedule requires a courseId; derive slots for this subject from the course schedule
	const subjectScheduleSlots = courseId
		? selectors
				.getSchedule(state, courseId)
				.filter((slot) => slot.subjectId === selectedSubjectId)
		: [];
	const classDayToday = isClassDay(
		selectedDate,
		selectedSubjectId,
		subjectScheduleSlots,
	);

	// Convert SubjectAttendanceMetrics → AttendanceMetrics (add missing fields with safe defaults)
	const rawMetrics = subjectData?.metrics;
	const metrics = rawMetrics
		? {
				...rawMetrics,
				absentPercent:
					rawMetrics.totalStudents > 0
						? Number(
								((rawMetrics.absent / rawMetrics.totalStudents) * 100).toFixed(1),
							)
						: 0,
				studentsAtRisk: [],
			}
		: null;

	// Preview for copy modal
	const previewData = copySourceDate
		? selectors.getSubjectAttendance(state, selectedSubjectId, copySourceDate)
		: undefined;
	const previewRecords = previewData?.records as AttendanceRecord[] | undefined;

	// URL sync
	const updateUrl = useCallback(
		(subjectId: string, date: string) => {
			const params = new URLSearchParams(searchParams.toString());
			params.set('subjectId', subjectId);
			params.set('date', date);
			router.replace(`/attendance/subject?${params.toString()}`);
		},
		[router, searchParams],
	);

	const handleSubjectChange = useCallback(
		(subjectId: string) => {
			setSelectedSubjectId(subjectId);
			updateUrl(subjectId, selectedDate);
		},
		[selectedDate, updateUrl],
	);

	const handleDateChange = useCallback(
		(date: string) => {
			setSelectedDate(date);
			updateUrl(selectedSubjectId, date);
		},
		[selectedSubjectId, updateUrl],
	);

	// Attendance mutations
	const handleStatusChange = useCallback(
		(studentId: string, status: AttendanceStatus) => {
			store.markSubjectAttendance(selectedSubjectId, courseId, selectedDate, [
				{ studentId, status },
			]);
			toast.success('Asistencia guardada correctamente');
		},
		[store, selectedSubjectId, courseId, selectedDate],
	);

	const handleMarkAll = useCallback(
		(status: AttendanceStatus) => {
			const entries = courseStudents.map((s) => ({
				studentId: s.id,
				status,
			}));
			store.markSubjectAttendance(
				selectedSubjectId,
				courseId,
				selectedDate,
				entries,
			);
			toast.success('Asistencia guardada correctamente');
		},
		[store, courseStudents, selectedSubjectId, courseId, selectedDate],
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
			toast.success('Justificación registrada correctamente');
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
			if (!selectedSubjectId || !selectedDate) return;
			store.copyAttendance(
				toSubjectCopyInput(selectedSubjectId, selectedDate, sourceDate),
			);
			toast.success('Asistencia copiada correctamente');
			handleCloseCopy();
		},
		[store, selectedSubjectId, selectedDate, handleCloseCopy],
	);

	return (
		<SubjectAttendancePage
			subjects={scopedSubjects}
			gridStudents={gridStudents}
			metrics={metrics}
			selectedSubjectId={selectedSubjectId}
			selectedDate={selectedDate}
			selectedSubjectName={selectedSubject?.name}
			isClassDay={classDayToday}
			isLoadingSubjects={false}
			isLoadingAttendance={false}
			isSaving={false}
			isBulkSaving={false}
			onSubjectChange={handleSubjectChange}
			onDateChange={handleDateChange}
			onStatusChange={handleStatusChange}
			onMarkAll={handleMarkAll}
			isCopyOpen={isCopyOpen}
			onOpenCopy={handleOpenCopy}
			onCloseCopy={handleCloseCopy}
			onSourceDateChange={handleSourceDateChange}
			copySourceDate={copySourceDate}
			previewRecords={previewRecords}
			isLoadingPreview={false}
			onConfirmCopy={handleConfirmCopy}
			isSubmittingCopy={false}
			isJustifyOpen={isJustifyOpen}
			selectedRecordToJustify={selectedRecordToJustify}
			onJustify={handleOpenJustify}
			onCloseJustify={handleCloseJustify}
			onConfirmJustify={handleConfirmJustify}
			isSubmittingJustify={false}
		/>
	);
}
