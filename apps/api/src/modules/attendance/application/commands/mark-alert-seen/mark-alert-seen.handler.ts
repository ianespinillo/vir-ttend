import { NotFoundException } from '@nestjs/common';
import { IAttendanceAlertRepository } from '../../../domain/repositories/attendance-alert.repository.interface';
import { MarkAlertSeenCommand } from './mark-alert-seen.command';

export class MarkAlertSeenHandler {
	constructor(
		private readonly alertAttendanceRepo: IAttendanceAlertRepository,
	) {}
	async execute(command: MarkAlertSeenCommand): Promise<void> {
		const alert = await this.alertAttendanceRepo.findById(command.alertId);
		if (!alert)
			throw new NotFoundException(`No alert found with id ${command.alertId}`);
		alert.markAsSeen(command.seenBy);
		await this.alertAttendanceRepo.save(alert);
	}
}
