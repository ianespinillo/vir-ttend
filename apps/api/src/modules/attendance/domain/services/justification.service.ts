import { ATTENDANCE_STATUS } from '@repo/common';
import { AcademicYear } from '../entities/academic-year.entity';
import { AttendanceRecord } from '../entities/attendance-record.entity';

const JUSTIFIABLE_STATUSES: readonly string[] = [
	ATTENDANCE_STATUS.ABSENT,
	ATTENDANCE_STATUS.LATE,
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
}
