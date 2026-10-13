import type { OutboxRecord } from '../offline/outbox-types';
import type { AttendanceRecordItem } from './types';

/**
 * Applies queued outbox records on top of the cached server records.
 *
 * - Students whose status is unchanged keep every server field (id,
 *   justification, name...), including a `justified` status.
 * - Students whose status changes keep their record id and name; the
 *   justification is dropped because the new status no longer carries one.
 * - Cached students that are not in the outbox stay untouched.
 */
export const mergeOptimisticRecords = (
	previous: readonly AttendanceRecordItem[],
	queued: readonly OutboxRecord[],
): AttendanceRecordItem[] => {
	const queuedByStudent = new Map(queued.map((r) => [r.studentId, r]));
	const previousIds = new Set(previous.map((p) => p.studentId));

	const merged: AttendanceRecordItem[] = previous.map((existing) => {
		const next = queuedByStudent.get(existing.studentId);
		if (!next) return existing;
		if (existing.status === next.status) return existing;
		const { justification: _dropped, ...rest } = existing;
		return { ...rest, status: next.status };
	});

	for (const r of queued) {
		if (previousIds.has(r.studentId)) continue;
		merged.push({ studentId: r.studentId, status: r.status });
	}

	return merged;
};
