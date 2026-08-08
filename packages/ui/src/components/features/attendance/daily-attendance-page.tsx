'use client';

import {
	ATTENDANCE_STATUS,
	type AttendanceRecord,
	type AttendanceStatus,
} from '@repo/common';
import {
	useActiveAcademicYear,
	useAttendanceMetrics,
	useBulkAttendance,
	useCurrentUser,
	useDailyAttendance,
	useJustifyAttendance,
	useMyCourses,
	useRegisterDailyAttendance,
} from '@repo/hooks';
import { format } from 'date-fns';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '../../shared/page-header';
import { AttendanceGrid } from './attendance-grid/attendance-grid';
import type { StudentRowItem } from './attendance-grid/attendance-row';
import { AttendanceSummary } from './attendance-summary/attendance-summary';
import { AttendanceToolbar } from './attendance-toolbar/attendance-toolbar';
import { JustificationModal } from './justification-modal/justification-modal';

export interface DailyAttendancePageProps {
	initialCourseId?: string;
	initialDate?: string;
	onUrlChange?: (courseId: string, date: string) => void;
}

export function DailyAttendancePage({
	initialCourseId,
	initialDate,
	onUrlChange,
}: DailyAttendancePageProps) {
	const getInitialDate = () => {
		if (initialDate) return initialDate;
		const today = new Date();
		const day = today.getDay();
		if (day === 0) today.setDate(today.getDate() - 2);
		if (day === 6) today.setDate(today.getDate() - 1);
		return format(today, 'yyyy-MM-dd');
	};

	const [selectedDate, setSelectedDate] = useState<string>(getInitialDate);
	const [selectedCourseId, setSelectedCourseId] = useState<string>(
		initialCourseId || '',
	);

	const { data: currentUser } = useCurrentUser();
	const { data: activeYear, isLoading: isLoadingYear } = useActiveAcademicYear();

	const isPreceptor = currentUser?.role === 'preceptor';
	const { data: courses = [], isLoading: isLoadingCourses } = useMyCourses({
		academicYearId: activeYear?.id,
		isPreceptor,
	});

	useEffect(() => {
		if (!selectedCourseId && courses.length > 0) {
			const firstCourse = courses[0];
			if (firstCourse) {
				setSelectedCourseId(firstCourse.id);
			}
		}
	}, [courses, selectedCourseId]);

	const handleCourseChange = (courseId: string) => {
		setSelectedCourseId(courseId);
		if (onUrlChange) onUrlChange(courseId, selectedDate);
	};

	const handleDateChange = (date: string) => {
		setSelectedDate(date);
		if (onUrlChange && selectedCourseId) onUrlChange(selectedCourseId, date);
	};

	const {
		data: dailyRecords = [],
		isLoading: isLoadingDaily,
		isRefetching,
	} = useDailyAttendance({
		courseId: selectedCourseId,
		date: selectedDate,
	});

	const { data: metrics, isLoading: isLoadingMetrics } = useAttendanceMetrics({
		courseId: selectedCourseId,
		date: selectedDate,
	});

	const [localRecordsMap, setLocalRecordsMap] = useState<
		Record<string, AttendanceRecord>
	>({});

	useEffect(() => {
		if (dailyRecords) {
			const map: Record<string, AttendanceRecord> = {};
			for (const r of dailyRecords as AttendanceRecord[]) {
				map[r.studentId] = r;
			}
			setLocalRecordsMap(map);
		}
	}, [dailyRecords]);

	const registerDailyMutation = useRegisterDailyAttendance();
	const bulkMutation = useBulkAttendance();
	const justifyMutation = useJustifyAttendance();

	const [selectedRecordToJustify, setSelectedRecordToJustify] =
		useState<AttendanceRecord | null>(null);
	const [isJustifyOpen, setIsJustifyOpen] = useState(false);

	const handleStatusChange = useCallback(
		(studentId: string, status: AttendanceStatus) => {
			if (!selectedCourseId || !selectedDate) return;

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

			registerDailyMutation.mutate(
				{
					courseId: selectedCourseId,
					date: selectedDate,
					records: [{ studentId, status }],
				},
				{
					onError: () => {
						toast.error('Error al guardar asistencia');
						if (dailyRecords) {
							const map: Record<string, AttendanceRecord> = {};
							for (const r of dailyRecords as AttendanceRecord[]) {
								map[r.studentId] = r;
							}
							setLocalRecordsMap(map);
						}
					},
				},
			);
		},
		[selectedCourseId, selectedDate, registerDailyMutation, dailyRecords],
	);

	const handleMarkAll = useCallback(
		(status: AttendanceStatus) => {
			if (!selectedCourseId || !selectedDate) return;

			setLocalRecordsMap((prev: Record<string, AttendanceRecord>) => {
				const nextMap: Record<string, AttendanceRecord> = {};
				for (const [sId, r] of Object.entries(prev)) {
					nextMap[sId] = { ...r, status };
				}
				return nextMap;
			});

			bulkMutation.mutate(
				{
					courseId: selectedCourseId,
					date: selectedDate,
					defaultStatus: status,
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
		[selectedCourseId, selectedDate, bulkMutation],
	);

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
				courseId: selectedCourseId,
				date: selectedDate,
			});
			toast.success('Justificación registrada correctamente');
		} catch (_err) {
			toast.error('Error al guardar la justificación');
		}
	};

	const gridStudents: StudentRowItem[] = useMemo(() => {
		return (dailyRecords as AttendanceRecord[]).map((r: AttendanceRecord) => {
			const local = localRecordsMap[r.studentId];
			return {
				id: r.studentId,
				name: r.studentName,
				attendanceRecord: local || r,
			};
		});
	}, [dailyRecords, localRecordsMap]);

	return (
		<div className="space-y-6">
			<PageHeader
				title="Asistencia Diaria"
				description="Panel de registro y control de asistencia diaria por curso"
			/>

			<AttendanceToolbar
				courses={courses}
				selectedCourseId={selectedCourseId}
				onCourseChange={handleCourseChange}
				selectedDate={selectedDate}
				onDateChange={handleDateChange}
				onMarkAll={handleMarkAll}
				isLoadingCourses={isLoadingYear || isLoadingCourses}
				isBulkSaving={bulkMutation.isPending}
				disabled={!selectedCourseId}
			/>

			{selectedCourseId && (
				<>
					<AttendanceSummary metrics={metrics} isLoading={isLoadingMetrics} />

					<AttendanceGrid
						students={gridStudents}
						onStatusChange={handleStatusChange}
						onJustify={handleOpenJustify}
						isLoading={isLoadingDaily}
						isSaving={registerDailyMutation.isPending || isRefetching}
					/>
				</>
			)}

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
