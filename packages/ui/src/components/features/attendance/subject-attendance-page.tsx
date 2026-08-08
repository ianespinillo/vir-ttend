'use client';

import {
	ATTENDANCE_STATUS,
	type AttendanceRecord,
	type AttendanceStatus,
	DAYOFWEEK,
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
import { format, parseISO } from 'date-fns';
import { AlertCircle, Copy } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../../../ui/button';
import { PageHeader } from '../../shared/page-header';
import { AttendanceGrid } from './attendance-grid/attendance-grid';
import type { StudentRowItem } from './attendance-grid/attendance-row';
import { AttendanceSummary } from './attendance-summary/attendance-summary';
import { AttendanceToolbar } from './attendance-toolbar/attendance-toolbar';
import { CopyAttendanceModal } from './copy-attendance-modal';
import { JustificationModal } from './justification-modal/justification-modal';

export interface SubjectAttendancePageProps {
	initialSubjectId?: string;
	initialDate?: string;
	onUrlChange?: (subjectId: string, date: string) => void;
}

export function SubjectAttendancePage({
	initialSubjectId,
	initialDate,
	onUrlChange,
}: SubjectAttendancePageProps) {
	const getInitialDate = () => {
		if (initialDate) return initialDate;
		const today = new Date();
		const day = today.getDay();
		if (day === 0) today.setDate(today.getDate() - 2);
		if (day === 6) today.setDate(today.getDate() - 1);
		return format(today, 'yyyy-MM-dd');
	};

	const [selectedDate, setSelectedDate] = useState<string>(getInitialDate);
	const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
		initialSubjectId || '',
	);

	const { data: currentUser } = useCurrentUser();
	const { data: activeYear, isLoading: isLoadingYear } = useActiveAcademicYear();

	const isTeacher = currentUser?.role === 'teacher';
	const { data: teacherSubjects = [], isLoading: isLoadingTeacherSubjects } =
		useTeacherSubjects({
			teacherId: currentUser?.id,
			academicYearId: activeYear?.id,
		});

	const { data: allSubjects = [], isLoading: isLoadingAllSubjects } =
		useSubjects();

	const subjects =
		isTeacher && teacherSubjects.length > 0 ? teacherSubjects : allSubjects;
	const isLoadingSubjects =
		isLoadingYear ||
		(isTeacher ? isLoadingTeacherSubjects : isLoadingAllSubjects);

	useEffect(() => {
		if (!selectedSubjectId && subjects.length > 0) {
			const first = subjects[0];
			if (first) setSelectedSubjectId(first.id);
		}
	}, [subjects, selectedSubjectId]);

	const selectedSubject = useMemo(() => {
		return subjects.find((s) => s.id === selectedSubjectId);
	}, [subjects, selectedSubjectId]);

	const { data: scheduleSlots = [] } = useSchedule(selectedSubject?.courseId);

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
		if (!selectedSubjectId || !selectedDayOfWeek || scheduleSlots.length === 0)
			return true;
		return scheduleSlots.some(
			(slot) =>
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

	const handleSubjectChange = (subjectId: string) => {
		setSelectedSubjectId(subjectId);
		if (onUrlChange) onUrlChange(subjectId, selectedDate);
	};

	const handleDateChange = (date: string) => {
		setSelectedDate(date);
		if (onUrlChange && selectedSubjectId) onUrlChange(selectedSubjectId, date);
	};

	const handleStatusChange = useCallback(
		(studentId: string, status: AttendanceStatus) => {
			if (!selectedSubjectId || !selectedDate || !selectedSubject?.courseId)
				return;

			setLocalRecordsMap((prev: Record<string, AttendanceRecord>) => {
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

			setLocalRecordsMap((prev: Record<string, AttendanceRecord>) => {
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

	const handleConfirmCopy = async () => {
		if (!selectedSubjectId || !selectedDate) return;
		try {
			await copyMutation.mutateAsync({
				subjectId: selectedSubjectId,
				targetDate: selectedDate,
			});
			toast.success('Asistencia copiada de la clase anterior');
		} catch (_err) {
			toast.error('Error al copiar la asistencia');
		}
	};

	const handleOpenJustify = (record: AttendanceRecord) => {
		setSelectedRecordToJustify(record);
		setIsJustifyOpen(true);
	};

	const handleConfirmJustify = async (reason: string, notes?: string) => {
		if (!selectedRecordToJustify?.id) return;
		try {
			await justifyMutation.mutateAsync({
				id: selectedRecordToJustify.id,
				reason,
				notes,
			});
			toast.success('Justificación registrada correctamente');
		} catch (_err) {
			toast.error('Error al guardar la justificación');
		}
	};

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

	return (
		<div className="space-y-6">
			<PageHeader
				title="Asistencia por Materia"
				description="Panel del docente para tomar asistencia y gestionar ausencias por materia"
			/>

			<AttendanceToolbar
				subjects={subjects}
				selectedSubjectId={selectedSubjectId}
				onSubjectChange={handleSubjectChange}
				selectedDate={selectedDate}
				onDateChange={handleDateChange}
				onMarkAll={handleMarkAll}
				isLoadingSubjects={isLoadingSubjects}
				isBulkSaving={bulkSubjectMutation.isPending}
				disabled={!selectedSubjectId}
				extraActions={
					selectedSubjectId && (
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => setIsCopyOpen(true)}
							disabled={copyMutation.isPending || !isClassDay}
							className="border-primary/30 text-primary hover:bg-primary/10"
						>
							<Copy className="mr-1.5 h-4 w-4 shrink-0" />
							Copiar de Clase Anterior
						</Button>
					)
				}
			/>

			{!isClassDay && (
				<div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-900 dark:text-amber-200 text-xs">
					<AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
					<span>
						<strong>Advertencia:</strong> La materia{' '}
						<strong>{selectedSubject?.name}</strong> no tiene clase agendada para el
						día seleccionado. El registro está deshabilitado.
					</span>
				</div>
			)}

			{selectedSubjectId && (
				<>
					<AttendanceSummary
						metrics={
							subjectAttendance?.metrics
								? {
										totalStudents: subjectAttendance.metrics.totalStudents,
										present: subjectAttendance.metrics.present,
										absent: subjectAttendance.metrics.absent,
										late: subjectAttendance.metrics.late,
										justified: subjectAttendance.metrics.justified,
										absentPercent: Math.round(
											(subjectAttendance.metrics.absent /
												(subjectAttendance.metrics.totalStudents || 1)) *
												100,
										),
										studentsAtRisk: [],
									}
								: null
						}
						isLoading={isLoadingAttendance}
					/>

					<AttendanceGrid
						students={gridStudents}
						onStatusChange={handleStatusChange}
						onJustify={handleOpenJustify}
						isLoading={isLoadingAttendance}
						isSaving={
							registerSubjectMutation.isPending || isRefetching || !isClassDay
						}
					/>
				</>
			)}

			<CopyAttendanceModal
				isOpen={isCopyOpen}
				onClose={() => setIsCopyOpen(false)}
				subjectName={selectedSubject?.name}
				targetDate={selectedDate}
				onConfirm={handleConfirmCopy}
				isSubmitting={copyMutation.isPending}
			/>

			<JustificationModal
				isOpen={isJustifyOpen}
				onClose={() => setIsJustifyOpen(false)}
				studentName={selectedRecordToJustify?.studentName}
				onConfirm={handleConfirmJustify}
				isSubmitting={justifyMutation.isPending}
			/>
		</div>
	);
}
