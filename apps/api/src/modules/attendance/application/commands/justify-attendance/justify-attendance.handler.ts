import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ATTENDANCE_STATUS } from '@repo/common';
import { DomainError, NotFoundError } from '../../../../../common/errors';
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
		@Inject('IJustificationRepository')
		private readonly justificationRepo: IJustificationRepository,
		@Inject('IAttendanceRecordRepository')
		private readonly attendaceRepo: IAttendanceRecordRepository,
		private readonly em: EventEmitter2,
		@Inject('IAcademicYearPort')
		private readonly accademicYearPort: IAcademicYearPort,
	) {}

	async execute(command: JustifyAttendanceCommand): Promise<void> {
		const record = await this.attendaceRepo.findById(command.attendanceRecordId);
		// A record of another tenant is reported as missing, not forbidden, so
		// the endpoint does not reveal that the id exists elsewhere.
		if (!record || record.tenantId !== command.tenantId)
			throw new NotFoundError('Registro de asistencia no encontrado');
		const year = await this.accademicYearPort.findActiveByTenant(record.tenantId);
		if (!year) throw new NotFoundError('No hay un ciclo lectivo activo');
		if (!JustificationService.canJustify(record, year))
			throw new DomainError(
				'Solo se pueden justificar inasistencias o tardanzas del ciclo lectivo activo.',
			);
		const justification = Justification.create({
			attendanceRecordId: record.id,
			createdBy: command.justifiedBy,
			reason: command.reason,
			notes: command.notes ?? undefined,
		});
		// Persist the justification first: if it fails the record is still
		// ABSENT/LATE, so the request can simply be retried.
		await this.justificationRepo.save(justification);
		record.updateStatus(ATTENDANCE_STATUS.JUSTIFIED, command.justifiedBy);
		await this.attendaceRepo.save(record);
		this.em.emit(
			'justification',
			new AttendanceJustifiedEvent(new Date(), justification, record),
		);
	}
}
