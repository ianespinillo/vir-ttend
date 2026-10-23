import { ATTENDANCE_STATUS } from '@repo/common';
import { AcademicYear } from '../entities/academic-year.entity';
import { AttendanceRecord } from '../entities/attendance-record.entity';
import { WorkshopAttendanceRecord } from '../entities/workshop-attendance-record.entity';

const JUSTIFIABLE_STATUSES: readonly string[] = [
	ATTENDANCE_STATUS.ABSENT,
	ATTENDANCE_STATUS.LATE,
	ATTENDANCE_STATUS.LATE_BEYOND_TOLERANCE,
];

export class JustificationService {
	/** Absences and late arrivals within the academic year can be justified. */
	static canJustify(
		record: AttendanceRecord,
		academicYear: AcademicYear,
	): boolean {
		const inRange: boolean =
			record.createdAt > academicYear.startDate &&
			record.createdAt < academicYear.endDate;
		return inRange && JUSTIFIABLE_STATUSES.includes(record.status);
	}

	/**
	 * Same rule for workshop records, judged by the workshop day (bounds
	 * inclusive) because workshop records can be taken retroactively.
	 */
	static canJustifyWorkshop(
		record: WorkshopAttendanceRecord,
		academicYear: AcademicYear,
	): boolean {
		const inRange: boolean =
			record.date >= academicYear.startDate && record.date <= academicYear.endDate;
		return inRange && JUSTIFIABLE_STATUSES.includes(record.status);
	}
}
