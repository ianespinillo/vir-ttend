import { Inject } from '@nestjs/common';
import { NotFoundError } from '../../../../../common/errors';
import { IAttendanceAlertRepository } from '../../../domain/repositories/attendance-alert.repository.interface';
import { MarkAlertSeenCommand } from './mark-alert-seen.command';

export class MarkAlertSeenHandler {
	constructor(
		@Inject('IAttendanceAlertRepository')
		private readonly alertAttendanceRepo: IAttendanceAlertRepository,
	) {}
	async execute(command: MarkAlertSeenCommand): Promise<void> {
		const alert = await this.alertAttendanceRepo.findById(command.alertId);
		if (!alert) throw new NotFoundError('Alerta no encontrada');
		if (alert.seenAt || alert.seenBy) {
			return;
		}
		alert.markAsSeen(command.seenBy);
		await this.alertAttendanceRepo.save(alert);
	}
}
