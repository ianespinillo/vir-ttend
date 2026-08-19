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
	useCopyDailyAttendance,
	useCurrentUser,
	useDailyAttendance,
	useJustifyAttendance,
	useMyCourses,
	useRegisterDailyAttendance,
} from '@repo/hooks';
import { Button, DailyAttendancePage, type StudentRowItem } from '@repo/ui';
import { format, subDays } from 'date-fns';
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
	const [originalRecordsMap, setOriginalRecordsMap] = useState<
		Record<string, AttendanceRecord>
	>({});

	useEffect(() => {
		if (dailyRecords) {
			const map: Record<string, AttendanceRecord> = {};
			for (const r of dailyRecords as AttendanceRecord[]) {
				map[r.studentId] = r;
			}
			setLocalRecordsMap(map);
			setOriginalRecordsMap(map);
		}
	}, [dailyRecords]);

	const registerDailyMutation = useRegisterDailyAttendance();
	const bulkMutation = useBulkAttendance();
	const justifyMutation = useJustifyAttendance();
	const copyDailyMutation = useCopyDailyAttendance();

	const [selectedRecordToJustify, setSelectedRecordToJustify] =
		useState<AttendanceRecord | null>(null);
	const [isJustifyOpen, setIsJustifyOpen] = useState(false);

	const [isCopyOpen, setIsCopyOpen] = useState(false);
	const [copySourceDate, setCopySourceDate] = useState<string | undefined>();
	const [previewCourseId, setPreviewCourseId] = useState<string>('');
	const [previewDate, setPreviewDate] = useState<string>('');

	const { data: previewRecords, isLoading: isLoadingPreview } =
		useDailyAttendance({
			courseId: previewCourseId,
			date: previewDate,
		});

	const hasPendingChanges = useMemo(() => {
		if (
			Object.keys(localRecordsMap).length !==
			Object.keys(originalRecordsMap).length
		) {
			return true;
		}
		for (const [studentId, local] of Object.entries(localRecordsMap)) {
			const original = originalRecordsMap[studentId];
			if (!original || local.status !== original.status) {
				return true;
			}
		}
		return false;
	}, [localRecordsMap, originalRecordsMap]);

	const handleStatusChange = useCallback(
		(studentId: string, status: AttendanceStatus) => {
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
		[],
	);

	const handleMarkAll = useCallback((status: AttendanceStatus) => {
		setLocalRecordsMap((prev) => {
			const nextMap: Record<string, AttendanceRecord> = {};
			for (const [sId, r] of Object.entries(prev)) {
				nextMap[sId] = { ...r, status };
			}
			return nextMap;
		});
	}, []);

	const handleConfirmChanges = useCallback(async () => {
		if (!selectedCourseId || !selectedDate) return;
		const changedRecords: { studentId: string; status: AttendanceStatus }[] = [];
		for (const [studentId, local] of Object.entries(localRecordsMap)) {
			const original = originalRecordsMap[studentId];
			if (!original || local.status !== original.status) {
				changedRecords.push({ studentId, status: local.status });
			}
		}
		if (changedRecords.length === 0) return;

		try {
			await registerDailyMutation.mutateAsync({
				courseId: selectedCourseId,
				date: selectedDate,
				records: changedRecords,
			});
			toast.success('Asistencia guardada correctamente');
		} catch {
			toast.error('Error al guardar asistencia');
			if (dailyRecords) {
				const map: Record<string, AttendanceRecord> = {};
				for (const r of dailyRecords as AttendanceRecord[]) {
					map[r.studentId] = r;
				}
				setLocalRecordsMap(map);
			}
		}
	}, [
		selectedCourseId,
		selectedDate,
		localRecordsMap,
		originalRecordsMap,
		registerDailyMutation,
		dailyRecords,
	]);

	const handleResetChanges = useCallback(() => {
		setLocalRecordsMap({ ...originalRecordsMap });
	}, [originalRecordsMap]);

	const handleOpenCopy = useCallback(() => {
		setCopySourceDate(undefined);
		setPreviewCourseId('');
		setPreviewDate('');
		setIsCopyOpen(true);
	}, []);

	const handleCloseCopy = useCallback(() => {
		setIsCopyOpen(false);
		setCopySourceDate(undefined);
		setPreviewCourseId('');
		setPreviewDate('');
	}, []);

	const handleCopySourceDateChange = useCallback(
		(date: string) => {
			setCopySourceDate(date);
			setPreviewCourseId(selectedCourseId);
			setPreviewDate(date);
		},
		[selectedCourseId],
	);

	const handleConfirmCopy = useCallback(
		async (sourceDate?: string) => {
			if (!selectedCourseId || !selectedDate) return;
			try {
				await copyDailyMutation.mutateAsync({
					courseId: selectedCourseId,
					targetDate: selectedDate,
					sourceDate,
				});
				toast.success('Asistencia copiada correctamente');
				handleCloseCopy();
			} catch {
				toast.error('Error al copiar la asistencia');
			}
		},
		[selectedCourseId, selectedDate, copyDailyMutation, handleCloseCopy],
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
			} catch {
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
			const original = originalRecordsMap[r.studentId];
			return {
				id: r.studentId,
				name: r.studentName,
				attendanceRecord: local || r,
				originalStatus: original?.status || r.status,
			};
		});
	}, [dailyRecords, localRecordsMap, originalRecordsMap]);

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
			isCopyOpen={isCopyOpen}
			onOpenCopy={handleOpenCopy}
			onCloseCopy={handleCloseCopy}
			onSourceDateChange={handleCopySourceDateChange}
			copySourceDate={copySourceDate}
			previewRecords={previewRecords as AttendanceRecord[] | undefined}
			isLoadingPreview={isLoadingPreview}
			onConfirmCopy={handleConfirmCopy}
			isSubmittingCopy={copyDailyMutation.isPending}
			onConfirmChanges={handleConfirmChanges}
			onResetChanges={handleResetChanges}
			hasPendingChanges={hasPendingChanges}
			extraActions={
				selectedCourseId ? (
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={handleOpenCopy}
						disabled={copyDailyMutation.isPending}
						className="border-blue-500/30 text-blue-700 hover:bg-blue-500/10 hover:text-blue-800 dark:text-blue-400 dark:hover:bg-blue-500/20 shadow-xs"
					>
						<Copy className="mr-1.5 h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
						Copiar de Otro Dia
					</Button>
				) : undefined
			}
		/>
	);
}
