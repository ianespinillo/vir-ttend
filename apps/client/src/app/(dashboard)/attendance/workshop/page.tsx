'use client';

import type { AttendanceRecord, AttendanceStatus } from '@repo/common';
import {
	useMyWorkshopCommissions,
	useRegisterWorkshopAttendance,
	useWorkshopAttendance,
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

	const registerMutation = useRegisterWorkshopAttendance();

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
				const record: AttendanceRecord | undefined = status
					? {
							id: r.id ?? '',
							studentId: r.studentId,
							studentName: r.studentName,
							status,
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
			setLocalStatuses((prev) => ({ ...prev, [studentId]: status }));
		},
		[],
	);

	const handleMarkAll = useCallback((status: AttendanceStatus) => {
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

	return (
		<WorkshopAttendancePage
			commissions={commissions ?? []}
			gridStudents={gridStudents}
			selectedCommissionId={selectedCommissionId}
			selectedDate={selectedDate}
			isLoadingCommissions={isLoadingCommissions}
			isLoadingAttendance={isLoadingAttendance}
			isSaving={registerMutation.isPending || isRefetching}
			onCommissionChange={setSelectedCommissionId}
			onDateChange={setSelectedDate}
			onStatusChange={handleStatusChange}
			onMarkAll={handleMarkAll}
			onConfirmChanges={handleConfirmChanges}
			onResetChanges={() => setLocalStatuses(savedStatuses)}
		/>
	);
}
