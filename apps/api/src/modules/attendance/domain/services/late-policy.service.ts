import { ATTENDANCE_STATUS, AttendanceStatus } from '@repo/common';

export class LatePolicyService {
	isLateCountedAsAbsence(
		minutesLater: number,
		thersholdsLater: number,
	): boolean {
		return minutesLater >= thersholdsLater;
	}
	adjustStatus(
		status: AttendanceStatus,
		minutesLate: number,
		abscenseThreshold: number,
	): AttendanceStatus {
		if (status !== ATTENDANCE_STATUS.LATE) return status;
		if (this.isLateCountedAsAbsence(minutesLate, abscenseThreshold))
			return ATTENDANCE_STATUS.ABSENT;
		return ATTENDANCE_STATUS.LATE;
	}
}
