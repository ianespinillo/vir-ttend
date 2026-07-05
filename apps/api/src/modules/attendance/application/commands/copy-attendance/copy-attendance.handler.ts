import { BadRequestException, Injectable } from '@nestjs/common';
import { AttendanceRecord } from '../../../domain/entities/attendance-record.entity';
import { IAttendanceRecordRepository } from '../../../domain/repositories/attendance-record.repository.interface';
import { AttendanceCopyService } from '../../../domain/services/attendance-copy.service';
import { CopyAttendanceCommand } from './copy-attendance.command';

@Injectable()
export class CopyAttendanceHandler {
	constructor(
		private readonly attendanceRepo: IAttendanceRecordRepository,
		private readonly copyAttendanceService: AttendanceCopyService,
	) {}
	async execute(command: CopyAttendanceCommand): Promise<void> {
		const sourceRecords = await this.copyAttendanceService.getLastClassRecords(
			command.subjectId,
			command.sourceDate ?? command.targetDate,
		);
		if (sourceRecords.length === 0)
			throw new BadRequestException('No records found for the source date');
		const result: AttendanceRecord[] = [];
		const existingRecords = await this.attendanceRepo.findBySubjectAndDate(
			command.subjectId,
			command.targetDate,
		);
		const existingsIds = new Set(
			existingRecords.map((record) => record.studentId),
		);
		for (const record of sourceRecords) {
			if (!existingsIds.has(record.studentId)) {
				result.push(
					AttendanceRecord.create({
						tenantId: record.tenantId,
						courseId: record.courseId,
						studentId: record.studentId,
						subjectId: command.subjectId,
						date: command.targetDate,
						status: record.status,
						editedBy: command.userId,
					}),
				);
			}
		}
		if (result.length > 0) await this.attendanceRepo.bulkSave(result);
		//Todo: Emit event
	}
}
