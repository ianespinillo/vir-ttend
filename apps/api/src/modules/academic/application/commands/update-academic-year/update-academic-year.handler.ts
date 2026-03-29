import { Injectable } from '@nestjs/common';
import { IAcademicYearRepository } from '../../../domain/repositories/academic-year.repository.interface';
import { UpdateAcademicYearCommand } from './update-academic-year.command';

@Injectable()
export class UpdateAcademicYearHandler {
	constructor(private readonly aYRepo: IAcademicYearRepository) {}
	async execute(command: UpdateAcademicYearCommand) {
		const period = await this.aYRepo.findById(command.academicYearId);
		if (!period) throw new Error('Academic year not found');
		command.nonWorkingDays?.forEach((d) => period.addNonWorkingDay(d));
		period.updateThresholds(
			command.thresholds.absenceThresholdPercent,
			command.thresholds.lateCountAbscenseAfterMinutes,
		);
		await this.aYRepo.save(period);
	}
}
