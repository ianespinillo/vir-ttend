import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { AttendanceRecord } from '../../../domain/entities/attendance-record.entity';
import { IAttendanceRecordRepository } from '../../../domain/repositories/attendance-record.repository.interface';
import { CopyDailyAttendanceCommand } from './copy-daily-attendance.command';

@Injectable()
export class CopyDailyAttendanceHandler {
	constructor(
		@Inject('IAttendanceRecordRepository')
		private readonly attendanceRepo: IAttendanceRecordRepository,
	) {}

	async execute(command: CopyDailyAttendanceCommand): Promise<void> {
		let sourceDate = command.sourceDate;

		if (!sourceDate) {
			const thirtyDaysAgo = new Date(command.targetDate);
			thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

			const recentRecords = await this.attendanceRepo.findByCourseAndRange(
				command.courseId,
				thirtyDaysAgo,
				command.targetDate,
			);

			if (recentRecords.length === 0) {
				throw new BadRequestException(
					'No se encontraron registros previos para este curso',
				);
			}

			const dates = [
				...new Set(
					recentRecords
						.map((r) => r.date.toISOString().split('T')[0])
						.filter((d) => d < command.targetDate.toISOString().split('T')[0]),
				),
			].sort();

			if (dates.length === 0) {
				throw new BadRequestException(
					'No se encontraron registros previos para este curso',
				);
			}

			sourceDate = new Date(dates[dates.length - 1]);
		}

		const sourceRecords = await this.attendanceRepo.findByCourseAndDate(
			command.courseId,
			sourceDate,
		);

		if (sourceRecords.length === 0) {
			throw new BadRequestException(
				'No se encontraron registros para la fecha origen',
			);
		}

		const existingRecords = await this.attendanceRepo.findByCourseAndDate(
			command.courseId,
			command.targetDate,
		);
		const existingIds = new Set(
			existingRecords.map((record) => record.studentId),
		);

		const result: AttendanceRecord[] = [];
		for (const record of sourceRecords) {
			if (!existingIds.has(record.studentId)) {
				result.push(
					AttendanceRecord.create({
						tenantId: record.tenantId,
						courseId: record.courseId,
						studentId: record.studentId,
						date: command.targetDate,
						status: record.status,
						editedBy: command.userId,
					}),
				);
			}
		}

		if (result.length > 0) {
			await this.attendanceRepo.bulkSave(result);
		}
	}
}
