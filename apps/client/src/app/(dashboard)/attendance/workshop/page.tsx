'use client';

import type {
	AttendanceRecord,
	AttendanceStatus,
	ErrorResponse,
} from '@repo/common';
import {
	useBulkJustifyWorkshopAttendance,
	useJustifyWorkshopAttendance,
	useMarkWorkshopSessionNotHeld,
	useMyWorkshopCommissions,
	useRegisterWorkshopAttendance,
	useUnmarkWorkshopSessionNotHeld,
	useWorkshopAttendance,
	useWorkshopSessionNotHeld,
} from '@repo/hooks';
import { type StudentRowItem, WorkshopAttendancePage } from '@repo/ui';
import { format } from 'date-fns';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

function getInitialDate(): string {
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

function getApiErrorMessage(error: unknown, fallback: string): string {
	const message = (error as { response?: { data?: ErrorResponse } } | undefined)
		?.response?.data?.message;
	if (Array.isArray(message)) return message.join('. ') || fallback;
	return message || fallback;
}

export default function AttendanceWorkshopPage() {
	const [selectedDate, setSelectedDate] = useState<string>(getInitialDate);
	const [selectedCommissionId, setSelectedCommissionId] = useState('');

	const { data: commissions, isLoading: isLoadingCommissions } =
		useMyWorkshopCommissions(selectedDate);

	const {
		data: attendance,
		isLoading: isLoadingAttendance,
		isRefetching,
	} = useWorkshopAttendance({
		commissionId: selectedCommissionId,
		date: selectedDate,
	});

	const { data: notHeldStatus } = useWorkshopSessionNotHeld(
		selectedCommissionId,
		selectedDate,
	);
	const notHeld = notHeldStatus?.notHeld
		? { reason: notHeldStatus.reason }
		: null;
	const markNotHeldMutation = useMarkWorkshopSessionNotHeld();
	const unmarkNotHeldMutation = useUnmarkWorkshopSessionNotHeld();

	const registerMutation = useRegisterWorkshopAttendance();
	const justifyMutation = useJustifyWorkshopAttendance();
	const bulkJustifyMutation = useBulkJustifyWorkshopAttendance();

	// Only saved, unchanged records (with an id) are offered for bulk justification.
	const [selectedRecordIds, setSelectedRecordIds] = useState<Set<string>>(
		() => new Set(),
	);
	const [isBulkJustify, setIsBulkJustify] = useState(false);
	const clearSelection = useCallback(() => setSelectedRecordIds(new Set()), []);

	const handleCommissionChange = useCallback(
		(commissionId: string) => {
			clearSelection();
			setSelectedCommissionId(commissionId);
		},
		[clearSelection],
	);

	const handleDateChange = useCallback(
		(date: string) => {
			clearSelection();
			setSelectedDate(date);
		},
		[clearSelection],
	);

	const [selectedRecordToJustify, setSelectedRecordToJustify] =
		useState<AttendanceRecord | null>(null);
	const [isJustifyOpen, setIsJustifyOpen] = useState(false);

	const [localStatuses, setLocalStatuses] = useState<
		Record<string, AttendanceStatus | null>
	>({});

	const savedStatuses = useMemo(() => {
		const map: Record<string, AttendanceStatus | null> = {};
		for (const r of attendance?.records ?? []) {
			map[r.studentId] = r.status;
		}
		return map;
	}, [attendance]);

	useEffect(() => {
		setLocalStatuses(savedStatuses);
	}, [savedStatuses]);

	const gridStudents: StudentRowItem[] = useMemo(
		() =>
			(attendance?.records ?? []).map((r) => {
				const status = localStatuses[r.studentId] ?? null;
				// Only an unchanged saved record keeps its id and justification, so
				// a status edited locally cannot be justified before it is saved.
				const isSaved = Boolean(r.id) && status === r.status;
				const record: AttendanceRecord | undefined = status
					? {
							id: isSaved ? (r.id ?? '') : '',
							studentId: r.studentId,
							studentName: r.studentName,
							status,
							justification: isSaved ? r.justification : undefined,
						}
					: undefined;
				return {
					id: r.studentId,
					name: r.studentName,
					attendanceRecord: record,
					originalStatus: r.status ?? undefined,
				};
			}),
		[attendance, localStatuses],
	);

	const handleStatusChange = useCallback(
		(studentId: string, status: AttendanceStatus) => {
			const editedId = attendance?.records.find(
				(r) => r.studentId === studentId,
			)?.id;
			if (editedId) {
				setSelectedRecordIds((prev) => {
					if (!prev.has(editedId)) return prev;
					const next = new Set(prev);
					next.delete(editedId);
					return next;
				});
			}
			setLocalStatuses((prev) => ({ ...prev, [studentId]: status }));
		},
		[attendance],
	);

	const handleMarkAll = useCallback((status: AttendanceStatus) => {
		setSelectedRecordIds(new Set());
		setLocalStatuses((prev) => {
			const next: Record<string, AttendanceStatus | null> = {};
			for (const studentId of Object.keys(prev)) next[studentId] = status;
			return next;
		});
	}, []);

	const handleConfirmChanges = useCallback(async () => {
		if (!selectedCommissionId || !selectedDate) return;
		const records: { studentId: string; status: AttendanceStatus }[] = [];
		for (const student of gridStudents) {
			const status = localStatuses[student.id];
			if (status) records.push({ studentId: student.id, status });
		}
		if (records.length === 0) {
			toast.error('Marcá la asistencia de al menos un alumno');
			return;
		}
		try {
			await registerMutation.mutateAsync({
				commissionId: selectedCommissionId,
				date: selectedDate,
				records,
			});
			toast.success('Asistencia guardada correctamente');
		} catch {
			toast.error('Error al guardar asistencia');
			setLocalStatuses(savedStatuses);
		}
	}, [
		selectedCommissionId,
		selectedDate,
		gridStudents,
		localStatuses,
		registerMutation,
		savedStatuses,
	]);

	const handleMarkNotHeld = useCallback(
		async (reason?: string) => {
			if (!selectedCommissionId || !selectedDate) return;
			try {
				await markNotHeldMutation.mutateAsync({
					commissionId: selectedCommissionId,
					date: selectedDate,
					reason,
				});
				// Unsaved edits and the selection refer to records that no longer exist.
				setLocalStatuses({});
				clearSelection();
				toast.success('Taller marcado como no dictado');
			} catch (error) {
				toast.error(
					getApiErrorMessage(error, 'Error al marcar el taller como no dictado'),
				);
			}
		},
		[selectedCommissionId, selectedDate, markNotHeldMutation, clearSelection],
	);

	const handleUnmarkNotHeld = useCallback(async () => {
		if (!selectedCommissionId || !selectedDate) return;
		try {
			await unmarkNotHeldMutation.mutateAsync({
				commissionId: selectedCommissionId,
				date: selectedDate,
			});
			toast.success('Taller marcado como dictado');
		} catch (error) {
			toast.error(
				getApiErrorMessage(error, 'Error al marcar el taller como dictado'),
			);
		}
	}, [selectedCommissionId, selectedDate, unmarkNotHeldMutation]);

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
					recordId: selectedRecordToJustify.id,
					reason,
					notes,
					commissionId: selectedCommissionId,
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
			selectedCommissionId,
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
					commissionId: selectedCommissionId,
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
			selectedCommissionId,
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
		<WorkshopAttendancePage
			commissions={commissions ?? []}
			gridStudents={gridStudents}
			selectedCommissionId={selectedCommissionId}
			selectedDate={selectedDate}
			isLoadingCommissions={isLoadingCommissions}
			isLoadingAttendance={isLoadingAttendance}
			isSaving={registerMutation.isPending || isRefetching}
			onCommissionChange={handleCommissionChange}
			onDateChange={handleDateChange}
			onStatusChange={handleStatusChange}
			onMarkAll={handleMarkAll}
			onConfirmChanges={handleConfirmChanges}
			onResetChanges={() => setLocalStatuses(savedStatuses)}
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
			notHeld={notHeld}
			onMarkNotHeld={handleMarkNotHeld}
			onUnmarkNotHeld={handleUnmarkNotHeld}
			isNotHeldPending={
				markNotHeldMutation.isPending || unmarkNotHeldMutation.isPending
			}
		/>
	);
}
