import { Injectable } from '@nestjs/common';
import { AttendanceRecord as AttendanceAttendanceRecord } from '../../../attendance/domain/entities/attendance-record.entity';
import { AttendanceRecordRepository } from '../../../attendance/infrastructure/persistence/repository/attendance-record.repository';
import { AttendanceRecord } from '../../domain/entities/attendance-record.entity';
import { IAttendanceRecordPort } from '../../domain/ports/attendance.port.interface';

@Injectable()
export class AttendanceRecordAdapter implements IAttendanceRecordPort {
	constructor(private readonly attendanceRepo: AttendanceRecordRepository) {}
	async findByStudentAndDateRange(
		studentId: string,
		from: Date,
		to: Date,
	): Promise<AttendanceRecord[]> {
		const records = await this.attendanceRepo.findByStudentAndDateRange(
			studentId,
			from,
			to,
		);
		return records.map(this.toDomain);
	}
	async findByCourseAndDateRange(
		courseId: string,
		from: Date,
		to: Date,
	): Promise<AttendanceRecord[]> {
		const records = await this.attendanceRepo.findByCourseAndRange(
			courseId,
			from,
			to,
		);
		return records.map(this.toDomain);
	}
	private toDomain(r: AttendanceAttendanceRecord): AttendanceRecord {
		return AttendanceRecord.reconstitute({
			id: r.id,
			studentId: r.studentId,
			courseId: r.courseId,
			status: r.status,
			date: r.date,
		});
	}
}
