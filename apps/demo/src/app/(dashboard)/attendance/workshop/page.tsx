'use client';

/**
 * Demo `/attendance/workshop` — workshop attendance per commission.
 *
 * Mirrors `apps/client/src/app/(dashboard)/attendance/workshop/page.tsx`: the
 * user's commissions (every commission for admins, the assigned ones for
 * preceptors), a staged grid and "Confirm" to save. Reads and writes go through
 * the demo store (`getMyWorkshopCommissions`, `getWorkshopAttendance`,
 * `registerWorkshopAttendance`).
 */

import { getInitialAttendanceDate } from '@/lib/attendance/attendance-mappings';
import { useDemo } from '@/lib/session/demo-provider';
import { demoTodayDate } from '@/lib/store/types';
import type { AttendanceRecord, AttendanceStatus } from '@repo/common';
import { type StudentRowItem, WorkshopAttendancePage } from '@repo/ui';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

export default function AttendanceWorkshopPage() {
	const { state, session, selectors, store } = useDemo();
	const user = session.user;

	const [selectedDate, setSelectedDate] = useState<string>(() =>
		getInitialAttendanceDate(demoTodayDate()),
	);
	const [selectedCommissionId, setSelectedCommissionId] = useState('');
	// Edits staged until "Confirm": studentId -> status (per commission and date).
	const [staged, setStaged] = useState<{
		key: string;
		statuses: Record<string, AttendanceStatus | null>;
	}>({ key: '', statuses: {} });

	const commissions = selectors.getMyWorkshopCommissions(
		state,
		user ? { id: user.id, role: user.role } : null,
		selectedDate,
	);
	const attendance = selectedCommissionId
		? selectors.getWorkshopAttendance(state, selectedCommissionId, selectedDate)
		: null;

	const savedStatuses = useMemo(() => {
		const map: Record<string, AttendanceStatus | null> = {};
		for (const record of attendance?.records ?? []) {
			map[record.studentId] = record.status;
		}
		return map;
	}, [attendance]);

	const stagingKey = `${selectedCommissionId}:${selectedDate}`;
	const localStatuses =
		staged.key === stagingKey
			? { ...savedStatuses, ...staged.statuses }
			: savedStatuses;

	const gridStudents: StudentRowItem[] = (attendance?.records ?? []).map(
		(record) => {
			const status = localStatuses[record.studentId] ?? null;
			const attendanceRecord: AttendanceRecord | undefined = status
				? {
						id: record.id ?? '',
						studentId: record.studentId,
						studentName: record.studentName,
						status,
					}
				: undefined;
			return {
				id: record.studentId,
				name: record.studentName,
				attendanceRecord,
				originalStatus: record.status ?? undefined,
			};
		},
	);

	const handleStatusChange = useCallback(
		(studentId: string, status: AttendanceStatus) => {
			setStaged((previous) => ({
				key: stagingKey,
				statuses: {
					...(previous.key === stagingKey ? previous.statuses : {}),
					[studentId]: status,
				},
			}));
		},
		[stagingKey],
	);

	const handleMarkAll = useCallback(
		(status: AttendanceStatus) => {
			const next: Record<string, AttendanceStatus | null> = {};
			for (const studentId of Object.keys(savedStatuses)) {
				next[studentId] = status;
			}
			setStaged({ key: stagingKey, statuses: next });
		},
		[savedStatuses, stagingKey],
	);

	const handleConfirm = useCallback(() => {
		if (!selectedCommissionId || !selectedDate) return;
		const entries = gridStudents.flatMap((student) => {
			const status = localStatuses[student.id];
			return status ? [{ studentId: student.id, status }] : [];
		});
		if (entries.length === 0) {
			toast.error('Marcá la asistencia de al menos un alumno');
			return;
		}
		try {
			store.registerWorkshopAttendance(
				selectedCommissionId,
				selectedDate,
				entries,
			);
			setStaged({ key: '', statuses: {} });
			toast.success('Asistencia guardada correctamente');
		} catch {
			toast.error('Error al guardar asistencia');
		}
	}, [selectedCommissionId, selectedDate, gridStudents, localStatuses, store]);

	return (
		<WorkshopAttendancePage
			commissions={commissions}
			gridStudents={gridStudents}
			selectedCommissionId={selectedCommissionId}
			selectedDate={selectedDate}
			isLoadingCommissions={false}
			isLoadingAttendance={false}
			isSaving={false}
			onCommissionChange={setSelectedCommissionId}
			onDateChange={setSelectedDate}
			onStatusChange={handleStatusChange}
			onMarkAll={handleMarkAll}
			onConfirmChanges={handleConfirm}
			onResetChanges={() => setStaged({ key: '', statuses: {} })}
		/>
	);
}
