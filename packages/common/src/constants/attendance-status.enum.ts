export const ATTENDANCE_STATUS = {
	PRESENT: 'present',
	ABSENT: 'absent',
	LATE: 'late',
	LATE_BEYOND_TOLERANCE: 'late_beyond_tolerance',
	JUSTIFIED: 'justified',
} as const;

export type AttendanceStatus =
	(typeof ATTENDANCE_STATUS)[keyof typeof ATTENDANCE_STATUS];

/** True for a late arrival within or beyond the tolerance. */
export const isLateStatus = (status: string | undefined): boolean =>
	status === ATTENDANCE_STATUS.LATE ||
	status === ATTENDANCE_STATUS.LATE_BEYOND_TOLERANCE;

export const ATTENDANCE_THRESHOLDS = {
	WARNING: 75,
	CRITICAL: 85,
} as const;
