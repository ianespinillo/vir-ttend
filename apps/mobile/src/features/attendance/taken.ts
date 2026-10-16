import type { OutboxItem } from '../offline/outbox-types';
import type { AttendanceRecordItem, RecordedAttendanceStatus } from './types';

/**
 * "Attendance taken today" derivation. The dashboard snapshots are year-to-date
 * aggregates, so they cannot tell whether TODAY's list was taken; the day's own
 * records (`dailyAttendance` / `subjectAttendance`) and the outbox can.
 */

export interface DayCounts {
	present: number;
	absent: number;
	late: number;
	justified: number;
}

export type TakenState =
	/** Nothing known yet (query still loading, or offline without cache). */
	| { kind: 'unknown' }
	/** Today's list has not been taken (or its only save failed permanently). */
	| { kind: 'pending' }
	/** Today's list has at least one status, or is waiting in the outbox. */
	| { kind: 'taken'; counts: DayCounts };

const EMPTY_COUNTS: DayCounts = {
	present: 0,
	absent: 0,
	late: 0,
	justified: 0,
};

/** Counts the records that carry a status; unset statuses are ignored. */
export const countRecords = (
	records: readonly { status?: RecordedAttendanceStatus }[],
): DayCounts => {
	const counts: DayCounts = { ...EMPTY_COUNTS };
	for (const record of records) {
		if (record.status === 'present') counts.present++;
		else if (record.status === 'absent') counts.absent++;
		else if (
			record.status === 'late' ||
			record.status === 'late_beyond_tolerance'
		)
			counts.late++;
		else if (record.status === 'justified') counts.justified++;
	}
	return counts;
};

export const totalRecorded = (counts: DayCounts): number =>
	counts.present + counts.absent + counts.late + counts.justified;

/** An outbox item that failed permanently never reached the server. */
export const isPermanentFailure = (
	item: Pick<OutboxItem, 'status' | 'error'> | undefined,
): boolean => item?.status === 'failed' && item.error?.isPermanent === true;

/**
 * Taken when the day's records hold at least one status, or when a pending /
 * syncing / retrying outbox item exists for it (the cache is then optimistic
 * anyway, but the outbox is the source of truth while offline).
 */
export const deriveTakenState = (input: {
	records: readonly AttendanceRecordItem[] | undefined;
	outboxItem?: Pick<OutboxItem, 'status' | 'error' | 'records'>;
}): TakenState => {
	const { records, outboxItem } = input;

	if (outboxItem) {
		if (isPermanentFailure(outboxItem)) return { kind: 'pending' };
		return { kind: 'taken', counts: countRecords(outboxItem.records) };
	}

	if (records === undefined) return { kind: 'unknown' };

	const counts = countRecords(records);
	return totalRecorded(counts) > 0
		? { kind: 'taken', counts }
		: { kind: 'pending' };
};

/**
 * Today's attendance rate over the students recorded today: present and late
 * count as attended; absent and justified do not. `null` when nothing recorded.
 */
export const dayAttendancePercent = (counts: DayCounts): number | null => {
	const total = totalRecorded(counts);
	return total === 0 ? null : ((counts.present + counts.late) / total) * 100;
};

/** At most two decimals, Spanish decimal comma: 86.666 → "86,67%", 100 → "100%". */
export const formatPercent = (value: number): string =>
	`${String(Number(value.toFixed(2))).replace('.', ',')}%`;

/** "12P • 2A • 1T", plus "• 1J" only when there are justified students. */
export const formatDayCounts = (counts: DayCounts): string => {
	const base = `${counts.present}P • ${counts.absent}A • ${counts.late}T`;
	return counts.justified > 0 ? `${base} • ${counts.justified}J` : base;
};
