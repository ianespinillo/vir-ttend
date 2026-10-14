import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IWorkshopCommissionPort } from '../../../domain/ports/workshop-commission.port.interface';
import { assertCanManageWorkshopAttendance } from '../../services/workshop-attendance-access.policy';
import { RegisterWorkshopAttendanceCommand } from '../register-workshop-attendance/register-workshop-attendance.command';
import { RegisterWorkshopAttendanceHandler } from '../register-workshop-attendance/register-workshop-attendance.handler';
import { BulkRegisterWorkshopAttendanceCommand } from './bulk-register-workshop-attendance.command';

/** Marks every ACTIVE student of the commission with the same status. */
@Injectable()
export class BulkRegisterWorkshopAttendanceHandler {
	constructor(
		@Inject('IWorkshopCommissionPort')
		private readonly commissionPort: IWorkshopCommissionPort,
		private readonly registerHandler: RegisterWorkshopAttendanceHandler,
	) {}

	async execute(command: BulkRegisterWorkshopAttendanceCommand): Promise<void> {
		const commission = await this.commissionPort.findById(command.commissionId);
		if (!commission) throw new NotFoundException('Commission not found');
		assertCanManageWorkshopAttendance(commission, {
			userId: command.userId,
			role: command.role,
			tenantId: command.tenantId,
		});
		const students = await this.commissionPort.getActiveStudents(commission.id);
		await this.registerHandler.execute(
			new RegisterWorkshopAttendanceCommand(
				command.tenantId,
				command.userId,
				command.role,
				command.commissionId,
				command.date,
				students.map((student) => ({
					studentId: student.id,
					status: command.status,
				})),
			),
		);
	}
}
