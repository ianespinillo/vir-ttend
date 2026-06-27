import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ATTENDANCE_STATUS } from '@repo/common';
import { Justification } from '../../../domain/entities/justification.entity';
import { AttendanceJustifiedEvent } from '../../../domain/events/attendance-justified.event';
import { IAcademicYearPort } from '../../../domain/ports/academic-year.port.interface';
import { IAttendanceRecordRepository } from '../../../domain/repositories/attendance-record.repository.interface';
import { IJustificationRepository } from '../../../domain/repositories/justification.repository.interface';
import { JustificationService } from '../../../domain/services/justification.service';
import { JustifyAttendanceCommand } from './justify-attendance.command';

@Injectable()
export class JustifyAttendanceHandler {
	constructor(
		private readonly justificationRepo: IJustificationRepository,
		private readonly attendaceRepo: IAttendanceRecordRepository,
		private readonly em: EventEmitter2,
		private readonly accademicYearPort: IAcademicYearPort,
	) {}

	async execute(command: JustifyAttendanceCommand): Promise<void> {
		const record = await this.attendaceRepo.findById(command.attendanceRecordId);
		if (!record) throw new NotFoundException('Attendance not found');
		const year = await this.accademicYearPort.findActiveByTenant(record.tenantId);
		if (!year) throw new NotFoundException('Academic year not found');
		if (!JustificationService.canJustify(record, year))
			throw new BadRequestException(
				`Cannot justify a record before ${year.lateCountAbscenseAfterMinutes} minutes`,
			);
		const justification = Justification.create({
			attendanceRecordId: record.id,
			createdBy: command.justifiedBy,
			reason: command.reason,
			notes: command.notes ?? undefined,
		});
		record.updateStatus(ATTENDANCE_STATUS.JUSTIFIED, command.justifiedBy);
		await this.attendaceRepo.save(record);
		await this.justificationRepo.save(justification);
		this.em.emit(
			'justification',
			new AttendanceJustifiedEvent(new Date(), justification, record),
		);
	}
}
