import { Injectable } from '@nestjs/common';
import { AttendanceRecord } from '../entities/attendance-record.entity';
import { IAttendanceRecordRepository } from '../repositories/attendance-record.repository.interface';

@Injectable()
export class AttendanceCopyService {
	constructor(private readonly attendanceRepo: IAttendanceRecordRepository) {}
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
