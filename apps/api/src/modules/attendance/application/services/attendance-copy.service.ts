import { Inject, Injectable } from '@nestjs/common';
import { AttendanceRecord } from '../../domain/entities/attendance-record.entity';
import { IAttendanceRecordRepository } from '../../domain/repositories/attendance-record.repository.interface';

@Injectable()
export class AttendanceCopyService {
	constructor(
		@Inject('IAttendanceRecordRepository')
		private readonly attendanceRepo: IAttendanceRecordRepository,
	) {}
	async getLastClassRecords(
		subjectId: string,
		target: Date,
	): Promise<AttendanceRecord[]> {
		if (!subjectId) {
			return this.attendanceRepo.findRecordsOfLastSubjectClass(
				subjectId,
				new Date(Date.now()),
			);
		}
		return this.attendanceRepo.findRecordsOfLastSubjectClass(subjectId, target);
	}
}
