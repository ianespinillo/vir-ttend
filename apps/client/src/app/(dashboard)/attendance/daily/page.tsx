'use client';

import {
	ATTENDANCE_STATUS,
	type AttendanceRecord,
	type AttendanceStatus,
	type ErrorResponse,
	isWorkshopOnlyCourse,
} from '@repo/common';
import {
	useActiveAcademicYear,
	useAttendanceMetrics,
	useBulkAttendance,
	useBulkJustifyAttendance,
	useCopyDailyAttendance,
	useCourseAttendanceHistory,
	useCurrentUser,
	useDailyAttendance,
	useJustifyAttendance,
	useMyCourses,
	useRegisterDailyAttendance,
} from '@repo/hooks';
import {
	Button,
	DailyAttendancePage,
	ReviewJustificationsModal,
	type StudentRowItem,
	localizeCourseName,
} from '@repo/ui';
import { endOfMonth, format, parseISO, startOfMonth, subDays } from 'date-fns';
import { Copy, FileCheck } from 'lucide-react';
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

function getBulkFailureCount(error: unknown): number | null {
	const response = (
		error as { response?: { status?: number; data?: ErrorResponse } } | undefined
	)?.response;
	if (response?.status !== 422) return null;
	const details = response.data?.details;
	return Array.isArray(details) ? details.length : 0;
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

	// Only saved, unchanged records (with an id) are offered for bulk justification.
	const [selectedRecordIds, setSelectedRecordIds] = useState<Set<string>>(
		() => new Set(),
	);
	const [isBulkJustify, setIsBulkJustify] = useState(false);
	const clearSelection = useCallback(() => setSelectedRecordIds(new Set()), []);

	const handleCourseChange = useCallback(
		(courseId: string) => {
			clearSelection();
			setSelectedCourseId(courseId);
			updateUrl(courseId, selectedDate);
		},
		[selectedDate, updateUrl, clearSelection],
	);

	const handleDateChange = useCallback(
		(date: string) => {
			clearSelection();
			setSelectedDate(date);
			if (selectedCourseId) updateUrl(selectedCourseId, date);
		},
		[selectedCourseId, updateUrl, clearSelection],
	);

	// Workshop-only courses (7th year technical) have no daily attendance: the
	// page shows a notice and never queries their daily records.
	const dailyCourseId = useMemo(() => {
		const selected = courses?.find((c) => c.id === selectedCourseId);
		return selected && isWorkshopOnlyCourse(selected) ? '' : selectedCourseId;
	}, [courses, selectedCourseId]);

	const {
		data: dailyRecords,
		isLoading: isLoadingDaily,
		isRefetching,
	} = useDailyAttendance({
		courseId: dailyCourseId,
		date: selectedDate,
	});

	const { data: metrics, isLoading: isLoadingMetrics } = useAttendanceMetrics({
		courseId: dailyCourseId,
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

	const registerDailyMutation = useRegisterDailyAttendance();
	const bulkMutation = useBulkAttendance();
	const justifyMutation = useJustifyAttendance();
	const bulkJustifyMutation = useBulkJustifyAttendance();
	const copyDailyMutation = useCopyDailyAttendance();

	const [selectedRecordToJustify, setSelectedRecordToJustify] =
		useState<AttendanceRecord | null>(null);
	const [isJustifyOpen, setIsJustifyOpen] = useState(false);

	const [isReviewJustificationsOpen, setIsReviewJustificationsOpen] =
		useState(false);

	const { monthStart, monthEnd } = useMemo(() => {
		if (!selectedDate) return { monthStart: '', monthEnd: '' };
		const d = parseISO(selectedDate);
		return {
			monthStart: format(startOfMonth(d), 'yyyy-MM-dd'),
			monthEnd: format(endOfMonth(d), 'yyyy-MM-dd'),
		};
	}, [selectedDate]);

	const { data: monthHistory, isLoading: isLoadingHistory } =
		useCourseAttendanceHistory({
			courseId: selectedCourseId,
			from: monthStart,
			to: monthEnd,
		});

	const justifiedRecords = useMemo(() => {
		return (monthHistory ?? []).filter(
			(r) => r.status === ATTENDANCE_STATUS.JUSTIFIED || Boolean(r.justification),
		);
	}, [monthHistory]);

	const selectedCourse = useMemo(() => {
		return courses?.find((c) => c.id === selectedCourseId);
	}, [courses, selectedCourseId]);

	const [isCopyOpen, setIsCopyOpen] = useState(false);
	const [copySourceDate, setCopySourceDate] = useState<string | undefined>();
	const [previewCourseId, setPreviewCourseId] = useState<string>('');
	const [previewDate, setPreviewDate] = useState<string>('');

	const { data: previewRecords, isLoading: isLoadingPreview } =
		useDailyAttendance({
			courseId: previewCourseId,
			date: previewDate,
		});

	const handleStatusChange = useCallback(
		(studentId: string, status: AttendanceStatus) => {
			const editedId = localRecordsMap[studentId]?.id;
			if (editedId) {
				setSelectedRecordIds((prev) => {
					if (!prev.has(editedId)) return prev;
					const next = new Set(prev);
					next.delete(editedId);
					return next;
				});
			}
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
		[localRecordsMap],
	);

	const handleMarkAll = useCallback((status: AttendanceStatus) => {
		setSelectedRecordIds(new Set());
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
		const records: { studentId: string; status: AttendanceStatus }[] = [];
		for (const student of gridStudents) {
			const local = localRecordsMap[student.id];
			records.push({
				studentId: student.id,
				status: local?.status || ATTENDANCE_STATUS.ABSENT,
			});
		}
		if (records.length === 0) return;

		try {
			await registerDailyMutation.mutateAsync({
				courseId: selectedCourseId,
				date: selectedDate,
				records,
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
		gridStudents,
		localRecordsMap,
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
		setIsBulkJustify(false);
	}, []);

	const handleOpenBulkJustify = useCallback(() => {
		setSelectedRecordToJustify(null);
		setIsBulkJustify(true);
		setIsJustifyOpen(true);
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

	const handleConfirmBulkJustify = useCallback(
		async (reason: string, notes?: string) => {
			const recordIds = [...selectedRecordIds];
			if (recordIds.length === 0) return;
			try {
				const result = await bulkJustifyMutation.mutateAsync({
					recordIds,
					reason,
					notes,
					courseId: selectedCourseId,
					date: selectedDate,
				});
				toast.success(
					result.justified === 1
						? '1 inasistencia justificada'
						: `${result.justified} inasistencias justificadas`,
				);
				clearSelection();
			} catch (error) {
				const failed = getBulkFailureCount(error);
				if (failed === null) {
					toast.error('Error al guardar la justificación');
				} else {
					toast.error(
						failed > 0
							? `No se justificó ninguna inasistencia: ${failed} no se pueden justificar. Revisá la selección.`
							: 'No se justificó ninguna inasistencia. Revisá la selección.',
					);
				}
			}
		},
		[
			selectedRecordIds,
			bulkJustifyMutation,
			selectedCourseId,
			selectedDate,
			clearSelection,
		],
	);

	const handleToggleSelect = useCallback((recordId: string) => {
		setSelectedRecordIds((prev) => {
			const next = new Set(prev);
			if (next.has(recordId)) next.delete(recordId);
			else next.add(recordId);
			return next;
		});
	}, []);

	const handleToggleSelectAll = useCallback(
		(recordIds: string[], selected: boolean) => {
			setSelectedRecordIds((prev) => {
				const next = new Set(prev);
				for (const id of recordIds) {
					if (selected) next.add(id);
					else next.delete(id);
				}
				return next;
			});
		},
		[],
	);

	return (
		<>
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
				onConfirmJustify={
					isBulkJustify ? handleConfirmBulkJustify : handleConfirmJustify
				}
				isSubmittingJustify={
					justifyMutation.isPending || bulkJustifyMutation.isPending
				}
				selectedRecordIds={selectedRecordIds}
				onToggleSelect={handleToggleSelect}
				onToggleSelectAll={handleToggleSelectAll}
				onBulkJustify={handleOpenBulkJustify}
				bulkJustifyCount={isBulkJustify ? selectedRecordIds.size : undefined}
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
				workshopAttendanceHref="/attendance/workshop"
				extraActions={
					selectedCourseId ? (
						<div className="flex flex-wrap items-center gap-2">
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => setIsReviewJustificationsOpen(true)}
								className="border-primary/40 text-primary hover:bg-primary-ink/10 shadow-xs"
							>
								<FileCheck className="mr-1.5 h-4 w-4 shrink-0" />
								Revisar justificaciones
							</Button>
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
						</div>
					) : undefined
				}
			/>
			<ReviewJustificationsModal
				open={isReviewJustificationsOpen}
				onClose={() => setIsReviewJustificationsOpen(false)}
				courseName={localizeCourseName(selectedCourse?.fullName)}
				selectedDate={selectedDate}
				justifiedRecords={justifiedRecords}
				isLoading={isLoadingHistory}
			/>
		</>
	);
}
