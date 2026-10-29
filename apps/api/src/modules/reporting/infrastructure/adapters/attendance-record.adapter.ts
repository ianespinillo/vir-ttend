import { Inject, Injectable } from '@nestjs/common';
import { AttendanceRecord as AttendanceAttendanceRecord } from '../../../attendance/domain/entities/attendance-record.entity';
import { WorkshopAttendanceRecord } from '../../../attendance/domain/entities/workshop-attendance-record.entity';
import { IDailySessionNotHeldRepository } from '../../../attendance/domain/repositories/daily-session-not-held.repository.interface';
import { IWorkshopAttendanceRecordRepository } from '../../../attendance/domain/repositories/workshop-attendance-record.repository.interface';
import { toDateKey } from '../../../attendance/domain/services/weighted-absence';
import { AttendanceRecordRepository } from '../../../attendance/infrastructure/persistence/repository/attendance-record.repository';
import { AttendanceRecord } from '../../domain/entities/attendance-record.entity';
import { IAttendanceRecordPort } from '../../domain/ports/attendance.port.interface';

@Injectable()
export class AttendanceRecordAdapter implements IAttendanceRecordPort {
	constructor(
		private readonly attendanceRepo: AttendanceRecordRepository,
		@Inject('IWorkshopAttendanceRecordRepository')
		private readonly workshopRepo: IWorkshopAttendanceRecordRepository,
		@Inject('IDailySessionNotHeldRepository')
		private readonly notHeldRepo: IDailySessionNotHeldRepository,
	) {}
	async findDailyByCourseAndDateRange(
		courseId: string,
		from: Date,
		to: Date,
	): Promise<AttendanceRecord[]> {
		const records = await this.attendanceRepo.findDailyByCourseAndDateRange(
			courseId,
			from,
			to,
		);
		return records.map(this.toDomain);
	}
	async findWorkshopByCourseAndDateRange(
		courseId: string,
		from: Date,
		to: Date,
	): Promise<AttendanceRecord[]> {
		const records = await this.workshopRepo.findByCourseAndDateRange(
			courseId,
			from,
			to,
		);
		return records.map(this.toDomain);
	}
	async findTheoryNotHeldDates(
		courseId: string,
		from: Date,
		to: Date,
	): Promise<string[]> {
		const markers = await this.notHeldRepo.findByCourseAndDateRange(
			courseId,
			from,
			to,
		);
		return markers.map((marker) => toDateKey(marker.date));
	}
	async findDailyByStudentAndDateRange(
		studentId: string,
		from: Date,
		to: Date,
	): Promise<AttendanceRecord[]> {
		const records = await this.attendanceRepo.findDailyByStudentAndDateRange(
			studentId,
			from,
			to,
		);
		return records.map(this.toDomain);
	}
	async findWorkshopByStudentAndDateRange(
		studentId: string,
		from: Date,
		to: Date,
	): Promise<AttendanceRecord[]> {
		const records = await this.workshopRepo.findByStudentAndDateRange(
			studentId,
			from,
			to,
		);
		return records.map(this.toDomain);
	}
	private toDomain(
		r: AttendanceAttendanceRecord | WorkshopAttendanceRecord,
	): AttendanceRecord {
		return AttendanceRecord.reconstitute({
			id: r.id,
			studentId: r.studentId,
			courseId: r.courseId,
			status: r.status,
			date: r.date,
		});
	}
}
