import { ATTENDANCE_STATUS } from '@repo/common';
import { AcademicYear } from '../entities/academic-year.entity';
import { AttendanceRecord } from '../entities/attendance-record.entity';

export class JustificationService {
	static canJustify(
		record: AttendanceRecord,
		academicYear: AcademicYear,
	): boolean {
		const inRange: boolean =
			record.createdAt > academicYear.startDate &&
			record.createdAt < academicYear.endDate;
		return inRange && record.status === ATTENDANCE_STATUS.ABSENT;
	}
}
