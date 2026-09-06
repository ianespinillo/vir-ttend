'use client';

import {
	ATTENDANCE_STATUS,
	type AttendanceRecord,
	type AttendanceStatus,
	DAYOFWEEK,
	type IScheduleSlotResponse,
} from '@repo/common';
import {
	useActiveAcademicYear,
	useBulkSubjectAttendance,
	useCopyAttendance,
	useCurrentUser,
	useJustifyAttendance,
	useRegisterSubjectAttendance,
	useSchedule,
	useSubjectAttendance,
	useSubjects,
	useTeacherSubjects,
} from '@repo/hooks';
import { Button, type StudentRowItem, SubjectAttendancePage } from '@repo/ui';
import { parseISO } from 'date-fns';
import { Copy } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

function getInitialDate(initialDate?: string): string {
	if (initialDate) return initialDate;
	const today = new Date();
	const day = today.getDay();
	if (day === 0) today.setDate(today.getDate() - 2);
	if (day === 6) today.setDate(today.getDate() - 1);
	return today.toISOString().split('T')[0];
}

export default function AttendanceSubjectPage() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const initialSubjectId = searchParams.get('subjectId') || undefined;
	const initialDate = searchParams.get('date') || undefined;

	const [selectedDate, setSelectedDate] = useState<string>(() =>
		getInitialDate(initialDate),
	);
	const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
		initialSubjectId || '',
	);

	const updateUrl = useCallback(
		(subjectId: string, date: string) => {
			const params = new URLSearchParams(searchParams.toString());
			params.set('subjectId', subjectId);
			params.set('date', date);
			router.replace(`${pathname}?${params.toString()}`);
		},
		[router, pathname, searchParams],
	);

	const { data: currentUser } = useCurrentUser();
	const { data: activeYear, isLoading: isLoadingYear } = useActiveAcademicYear();

	const isTeacher = currentUser?.role === 'teacher';
	const { data: teacherSubjects, isLoading: isLoadingTeacherSubjects } =
		useTeacherSubjects({
			teacherId: currentUser?.id,
			academicYearId: activeYear?.id,
		});

	const { data: allSubjects, isLoading: isLoadingAllSubjects } = useSubjects();

	const subjects =
		isTeacher && (teacherSubjects?.length ?? 0) > 0
			? (teacherSubjects ?? [])
			: (allSubjects ?? []);
	const isLoadingSubjects =
		isLoadingYear ||
		(isTeacher ? isLoadingTeacherSubjects : isLoadingAllSubjects);

	const selectedSubject = useMemo(() => {
		return subjects.find((s) => s.id === selectedSubjectId);
	}, [subjects, selectedSubjectId]);

	const { data: scheduleSlots } = useSchedule(selectedSubject?.courseId);

	const selectedDayOfWeek = useMemo(() => {
		if (!selectedDate) return null;
		const dateObj = parseISO(selectedDate);
		const day = dateObj.getDay();
		const map: Record<number, DAYOFWEEK> = {
			1: DAYOFWEEK.MONDAY,
			2: DAYOFWEEK.TUESDAY,
			3: DAYOFWEEK.WEDNESDAY,
			4: DAYOFWEEK.THURSDAY,
			5: DAYOFWEEK.FRIDAY,
		};
		return map[day] || null;
	}, [selectedDate]);

	const isClassDay = useMemo(() => {
		if (
			!selectedSubjectId ||
			!selectedDayOfWeek ||
			!scheduleSlots ||
			scheduleSlots.length === 0
		)
			return true;
		return scheduleSlots.some(
			(slot: IScheduleSlotResponse) =>
				slot.subjectId === selectedSubjectId &&
				slot.dayOfWeek === selectedDayOfWeek,
		);
	}, [selectedSubjectId, selectedDayOfWeek, scheduleSlots]);

	const {
		data: subjectAttendance,
		isLoading: isLoadingAttendance,
		isRefetching,
	} = useSubjectAttendance({
		subjectId: selectedSubjectId,
		date: selectedDate,
	});

	const registerSubjectMutation = useRegisterSubjectAttendance();
	const bulkSubjectMutation = useBulkSubjectAttendance();
	const copyMutation = useCopyAttendance();
	const justifyMutation = useJustifyAttendance();

	const [localRecordsMap, setLocalRecordsMap] = useState<
		Record<string, AttendanceRecord>
	>({});

	useEffect(() => {
		if (subjectAttendance?.records) {
			const map: Record<string, AttendanceRecord> = {};
			for (const r of subjectAttendance.records) {
				map[r.studentId] = r;
			}
			setLocalRecordsMap(map);
		}
	}, [subjectAttendance]);

	const [isCopyOpen, setIsCopyOpen] = useState(false);
	const [copySourceDate, setCopySourceDate] = useState<string | undefined>();
	const [isJustifyOpen, setIsJustifyOpen] = useState(false);
	const [selectedRecordToJustify, setSelectedRecordToJustify] =
		useState<AttendanceRecord | null>(null);

	const [previewSubjectId, setPreviewSubjectId] = useState<string>('');
	const [previewDate, setPreviewDate] = useState<string>('');

	const { data: previewAttendance, isLoading: isLoadingPreview } =
		useSubjectAttendance({
			subjectId: previewSubjectId,
			date: previewDate,
		});

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
			if (selectedSubjectId) updateUrl(selectedSubjectId, date);
		},
		[selectedSubjectId, updateUrl],
	);

	const handleStatusChange = useCallback(
		(studentId: string, status: AttendanceStatus) => {
			if (!selectedSubjectId || !selectedDate || !selectedSubject?.courseId)
				return;

			setLocalRecordsMap((prev) => {
				const existing = prev[studentId];
				const updated: AttendanceRecord = {
					id: existing?.id || '',
					studentId,
					studentName: existing?.studentName || '',
					status,
					justification: existing?.justification,
				};
				return { ...prev, [studentId]: updated };
			});
		},
		[selectedSubjectId, selectedDate, selectedSubject],
	);

	const handleMarkAll = useCallback(
		(status: AttendanceStatus) => {
			if (!selectedSubjectId || !selectedDate) return;

			setLocalRecordsMap((prev) => {
				const nextMap: Record<string, AttendanceRecord> = {};
				for (const [sId, r] of Object.entries(prev)) {
					nextMap[sId] = { ...r, status };
				}
				return nextMap;
			});
		},
		[selectedSubjectId, selectedDate],
	);

	const handleConfirmChanges = useCallback(async () => {
		if (!selectedSubjectId || !selectedDate || !selectedSubject?.courseId) return;

		const changedRecords: { studentId: string; status: AttendanceStatus }[] = [];
		for (const [studentId, local] of Object.entries(localRecordsMap)) {
			const serverRecord = subjectAttendance?.records?.find(
				(r) => r.studentId === studentId,
			);
			if (!serverRecord || local.status !== serverRecord.status) {
				changedRecords.push({ studentId, status: local.status });
			}
		}
		if (changedRecords.length === 0) return;

		try {
			await registerSubjectMutation.mutateAsync({
				subjectId: selectedSubjectId,
				courseId: selectedSubject.courseId,
				date: selectedDate,
				records: changedRecords,
			});
			toast.success('Asistencia guardada correctamente');
		} catch {
			toast.error('Error al guardar asistencia de la materia');
			if (subjectAttendance?.records) {
				const map: Record<string, AttendanceRecord> = {};
				for (const r of subjectAttendance.records) map[r.studentId] = r;
				setLocalRecordsMap(map);
			}
		}
	}, [
		selectedSubjectId,
		selectedDate,
		selectedSubject,
		registerSubjectMutation,
		subjectAttendance,
		localRecordsMap,
	]);

	const handleResetChanges = useCallback(() => {
		if (subjectAttendance?.records) {
			const map: Record<string, AttendanceRecord> = {};
			for (const r of subjectAttendance.records) {
				map[r.studentId] = r;
			}
			setLocalRecordsMap(map);
		}
	}, [subjectAttendance]);

	const hasPendingChanges = useMemo(() => {
		const serverRecords = subjectAttendance?.records || [];
		if (Object.keys(localRecordsMap).length !== serverRecords.length) {
			return true;
		}
		for (const serverRecord of serverRecords) {
			const local = localRecordsMap[serverRecord.studentId];
			if (!local || local.status !== serverRecord.status) {
				return true;
			}
		}
		return false;
	}, [localRecordsMap, subjectAttendance]);

	const handleOpenCopy = useCallback(() => {
		setCopySourceDate(undefined);
		setPreviewSubjectId('');
		setPreviewDate('');
		setIsCopyOpen(true);
	}, []);

	const handleCloseCopy = useCallback(() => {
		setIsCopyOpen(false);
		setCopySourceDate(undefined);
		setPreviewSubjectId('');
		setPreviewDate('');
	}, []);

	const handleCopySourceDateChange = useCallback(
		(date: string) => {
			setCopySourceDate(date);
			setPreviewSubjectId(selectedSubjectId);
			setPreviewDate(date);
		},
		[selectedSubjectId],
	);

	const handleConfirmCopy = useCallback(
		async (sourceDate?: string) => {
			if (!selectedSubjectId || !selectedDate) return;
			try {
				await copyMutation.mutateAsync({
					subjectId: selectedSubjectId,
					targetDate: selectedDate,
					sourceDate,
				});
				toast.success('Asistencia copiada de la clase anterior');
				handleCloseCopy();
			} catch {
				toast.error('Error al copiar la asistencia');
			}
		},
		[selectedSubjectId, selectedDate, copyMutation, handleCloseCopy],
	);

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
			try {
				await justifyMutation.mutateAsync({
					id: selectedRecordToJustify.id,
					reason,
					notes,
				});
				toast.success('Justificación registrada correctamente');
				handleCloseJustify();
			} catch {
				toast.error('Error al guardar la justificación');
			}
		},
		[selectedRecordToJustify, justifyMutation, handleCloseJustify],
	);

	const gridStudents: StudentRowItem[] = useMemo(() => {
		if (!subjectAttendance?.records) return [];
		return subjectAttendance.records.map((r: AttendanceRecord) => {
			const local = localRecordsMap[r.studentId];
			return {
				id: r.studentId,
				name: r.studentName,
				attendanceRecord: local || r,
				originalStatus: r.status,
			};
		});
	}, [subjectAttendance, localRecordsMap]);

	const subjectMetrics = useMemo(() => {
		if (!subjectAttendance?.metrics) return null;
		const m = subjectAttendance.metrics;
		return {
			totalStudents: m.totalStudents,
			present: m.present,
			absent: m.absent,
			late: m.late,
			justified: m.justified,
			absentPercent: Math.round((m.absent / (m.totalStudents || 1)) * 100),
			studentsAtRisk: [],
		};
	}, [subjectAttendance]);

	return (
		<SubjectAttendancePage
			subjects={subjects}
			gridStudents={gridStudents}
			metrics={subjectMetrics}
			selectedSubjectId={selectedSubjectId}
			selectedDate={selectedDate}
			selectedSubjectName={selectedSubject?.name}
			isClassDay={isClassDay}
			isLoadingSubjects={isLoadingSubjects}
			isLoadingAttendance={isLoadingAttendance}
			isSaving={registerSubjectMutation.isPending || isRefetching}
			isBulkSaving={bulkSubjectMutation.isPending}
			onSubjectChange={handleSubjectChange}
			onDateChange={handleDateChange}
			onStatusChange={handleStatusChange}
			onMarkAll={handleMarkAll}
			isCopyOpen={isCopyOpen}
			onOpenCopy={handleOpenCopy}
			onCloseCopy={handleCloseCopy}
			onSourceDateChange={handleCopySourceDateChange}
			copySourceDate={copySourceDate}
			previewRecords={previewAttendance?.records}
			isLoadingPreview={isLoadingPreview}
			onConfirmCopy={handleConfirmCopy}
			isSubmittingCopy={copyMutation.isPending}
			isJustifyOpen={isJustifyOpen}
			selectedRecordToJustify={selectedRecordToJustify}
			onJustify={handleOpenJustify}
			onCloseJustify={handleCloseJustify}
			onConfirmJustify={handleConfirmJustify}
			isSubmittingJustify={justifyMutation.isPending}
			extraActions={
				selectedSubjectId ? (
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={handleOpenCopy}
						disabled={copyMutation.isPending || !isClassDay}
						className="border-blue-500/30 text-blue-700 hover:bg-blue-500/10 hover:text-blue-800 dark:text-blue-400 dark:hover:bg-blue-500/20 shadow-xs"
					>
						<Copy className="mr-1.5 h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
						Copiar de Clase Anterior
					</Button>
				) : undefined
			}
		/>
	);
}
