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
import { DailyAttendancePage, type StudentRowItem } from '@repo/ui';
import { format } from 'date-fns';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

function getInitialDate(initialDate?: string): string {
	if (initialDate) return initialDate;
	const today = new Date();
	const day = today.getDay();
	if (day === 0) today.setDate(today.getDate() - 2);
	if (day === 6) today.setDate(today.getDate() - 1);
	return format(today, 'yyyy-MM-dd');
}

export default function AttendanceDailyPage() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const initialCourseId = searchParams.get('courseId') || undefined;
	const initialDate = searchParams.get('date') || undefined;

	const [selectedDate, setSelectedDate] = useState<string>(() =>
		getInitialDate(initialDate),
	);
	const [selectedCourseId, setSelectedCourseId] = useState<string>(
		initialCourseId || '',
	);

	const updateUrl = useCallback(
		(courseId: string, date: string) => {
			const params = new URLSearchParams(searchParams.toString());
			params.set('courseId', courseId);
			params.set('date', date);
			router.replace(`${pathname}?${params.toString()}`);
		},
		[router, pathname, searchParams],
	);

	const { data: currentUser } = useCurrentUser();
	const { data: activeYear, isLoading: isLoadingYear } = useActiveAcademicYear();

	const isPreceptor = currentUser?.role === 'preceptor';
	const { data: courses, isLoading: isLoadingCourses } = useMyCourses({
		academicYearId: activeYear?.id,
		isPreceptor,
	});

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
			if (selectedCourseId) updateUrl(selectedCourseId, date);
		},
		[selectedCourseId, updateUrl],
	);

	const {
		data: dailyRecords,
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

			setLocalRecordsMap((prev) => {
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
					courseId: selectedCourseId,
					date: selectedDate,
				});
				toast.success('Justificación registrada correctamente');
				handleCloseJustify();
			} catch (_err) {
				toast.error('Error al guardar la justificación');
			}
		},
		[
			selectedRecordToJustify,
			justifyMutation,
			selectedCourseId,
			selectedDate,
			handleCloseJustify,
		],
	);

	const gridStudents: StudentRowItem[] = useMemo(() => {
		return (dailyRecords ?? []).map((r: AttendanceRecord) => {
			const local = localRecordsMap[r.studentId];
			return {
				id: r.studentId,
				name: r.studentName,
				attendanceRecord: local || r,
			};
		});
	}, [dailyRecords, localRecordsMap]);

	return (
		<DailyAttendancePage
			courses={courses ?? []}
			gridStudents={gridStudents}
			metrics={metrics ?? null}
			selectedCourseId={selectedCourseId}
			selectedDate={selectedDate}
			isLoadingCourses={isLoadingYear || isLoadingCourses}
			isLoadingDaily={isLoadingDaily}
			isLoadingMetrics={isLoadingMetrics}
			isSaving={registerDailyMutation.isPending || isRefetching}
			isBulkSaving={bulkMutation.isPending}
			onCourseChange={handleCourseChange}
			onDateChange={handleDateChange}
			onStatusChange={handleStatusChange}
			onMarkAll={handleMarkAll}
			onJustify={handleOpenJustify}
			isJustifyOpen={isJustifyOpen}
			selectedRecordToJustify={selectedRecordToJustify}
			onCloseJustify={handleCloseJustify}
			onConfirmJustify={handleConfirmJustify}
			isSubmittingJustify={justifyMutation.isPending}
		/>
	);
}
