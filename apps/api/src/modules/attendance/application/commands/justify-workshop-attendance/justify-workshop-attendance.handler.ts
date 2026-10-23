import { Inject, Injectable } from '@nestjs/common';
import { ATTENDANCE_STATUS } from '@repo/common';
import { DomainError, NotFoundError } from '../../../../../common/errors';
import { WorkshopJustification } from '../../../domain/entities/workshop-justification.entity';
import { IAcademicYearPort } from '../../../domain/ports/academic-year.port.interface';
import { IWorkshopCommissionPort } from '../../../domain/ports/workshop-commission.port.interface';
import { IWorkshopAttendanceRecordRepository } from '../../../domain/repositories/workshop-attendance-record.repository.interface';
import { IWorkshopJustificationRepository } from '../../../domain/repositories/workshop-justification.repository.interface';
import { JustificationService } from '../../../domain/services/justification.service';
import { assertCanManageWorkshopAttendance } from '../../services/workshop-attendance-access.policy';
import { JustifyWorkshopAttendanceCommand } from './justify-workshop-attendance.command';

/**
 * Justifies an absent or late workshop record: stores the justification and
 * sets the record to JUSTIFIED. Only admins and the preceptor of the record's
 * commission may do it.
 */
@Injectable()
export class JustifyWorkshopAttendanceHandler {
	constructor(
		@Inject('IWorkshopJustificationRepository')
		private readonly justificationRepo: IWorkshopJustificationRepository,
		@Inject('IWorkshopAttendanceRecordRepository')
		private readonly attendanceRepo: IWorkshopAttendanceRecordRepository,
		@Inject('IWorkshopCommissionPort')
		private readonly commissionPort: IWorkshopCommissionPort,
		@Inject('IAcademicYearPort')
		private readonly academicYearPort: IAcademicYearPort,
	) {}

	async execute(command: JustifyWorkshopAttendanceCommand): Promise<void> {
		const record = await this.attendanceRepo.findById(
			command.workshopAttendanceRecordId,
		);
		if (!record) throw new NotFoundError('Registro de asistencia no encontrado');
		const commission = await this.commissionPort.findById(
			record.workshopCommissionId,
		);
		if (!commission) throw new NotFoundError('Comisión no encontrada');
		assertCanManageWorkshopAttendance(commission, {
			userId: command.userId,
			role: command.role,
			tenantId: command.tenantId,
		});
		const year = await this.academicYearPort.findActiveByTenant(record.tenantId);
		if (!year) throw new NotFoundError('No hay un ciclo lectivo activo');
		if (!JustificationService.canJustifyWorkshop(record, year))
			throw new DomainError(
				'Solo se pueden justificar inasistencias o tardanzas del ciclo lectivo activo.',
			);
		const justification = WorkshopJustification.create({
			workshopAttendanceRecordId: record.id,
			createdBy: command.userId,
			reason: command.reason,
			notes: command.notes ?? undefined,
		});
		// Persist the justification first: if it fails the record is still
		// ABSENT/LATE, so the request can simply be retried.
		await this.justificationRepo.save(justification);
		record.updateStatus(ATTENDANCE_STATUS.JUSTIFIED, command.userId);
		await this.attendanceRepo.bulkSave([record]);
	}
}
