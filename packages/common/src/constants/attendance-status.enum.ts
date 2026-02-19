export const ATTENDANCE_STATUS = {
	PRESENT: 'present',
	ABSENT: 'absent',
	LATE: 'late',
	JUSTIFIED: 'justified',
} as const;

export type AttendanceStatus =
	(typeof ATTENDANCE_STATUS)[keyof typeof ATTENDANCE_STATUS];

export const ATTENDANCE_THRESHOLDS = {
	WARNING: 75,
	CRITICAL: 85,
} as const;
