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
import { type StudentRowItem, SubjectAttendancePage } from '@repo/ui';
import { parseISO } from 'date-fns';
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
	const [isJustifyOpen, setIsJustifyOpen] = useState(false);
	const [selectedRecordToJustify, setSelectedRecordToJustify] =
		useState<AttendanceRecord | null>(null);

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

			registerSubjectMutation.mutate(
				{
					subjectId: selectedSubjectId,
					courseId: selectedSubject.courseId,
					date: selectedDate,
					records: [{ studentId, status }],
				},
				{
					onError: () => {
						toast.error('Error al guardar asistencia de la materia');
						if (subjectAttendance?.records) {
							const map: Record<string, AttendanceRecord> = {};
							for (const r of subjectAttendance.records) map[r.studentId] = r;
							setLocalRecordsMap(map);
						}
					},
				},
			);
		},
		[
			selectedSubjectId,
			selectedDate,
			selectedSubject,
			registerSubjectMutation,
			subjectAttendance,
		],
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

			bulkSubjectMutation.mutate(
				{
					subjectId: selectedSubjectId,
					date: selectedDate,
					status,
				},
				{
					onSuccess: () => {
						toast.success(
							`Se marcaron todos como ${
								status === ATTENDANCE_STATUS.PRESENT ? 'Presentes' : 'Ausentes'
							}`,
						);
					},
					onError: () => {
						toast.error('Error al marcar asistencia masiva');
					},
				},
			);
		},
		[selectedSubjectId, selectedDate, bulkSubjectMutation],
	);

	const handleOpenCopy = useCallback(() => {
		setIsCopyOpen(true);
	}, []);

	const handleCloseCopy = useCallback(() => {
		setIsCopyOpen(false);
	}, []);

	const handleConfirmCopy = useCallback(async () => {
		if (!selectedSubjectId || !selectedDate) return;
		try {
			await copyMutation.mutateAsync({
				subjectId: selectedSubjectId,
				targetDate: selectedDate,
			});
			toast.success('Asistencia copiada de la clase anterior');
			handleCloseCopy();
		} catch (_err) {
			toast.error('Error al copiar la asistencia');
		}
	}, [selectedSubjectId, selectedDate, copyMutation, handleCloseCopy]);

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
			} catch (_err) {
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
					<button
						type="button"
						onClick={handleOpenCopy}
						disabled={copyMutation.isPending || !isClassDay}
						className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 disabled:pointer-events-none disabled:opacity-50"
					>
						Copiar de Clase Anterior
					</button>
				) : undefined
			}
		/>
	);
}
