import { ATTENDANCE_STATUS } from '@repo/common';
import { AcademicYear } from '../../../academic/domain/entities/academic-year.entity';
import { IAcademicYearModel } from '../../application/models/academic-year.model';
import { AttendanceRecord } from '../entities/attendance-record.entity';

export class JustificationService {
	static canJustify(
		record: AttendanceRecord,
		academicYear: AcademicYear | IAcademicYearModel,
	): boolean {
		const inRange: boolean =
			record.createdAt > academicYear.startDate &&
			record.createdAt < academicYear.endDate;
		return inRange && record.status === ATTENDANCE_STATUS.ABSENT;
	}
}
