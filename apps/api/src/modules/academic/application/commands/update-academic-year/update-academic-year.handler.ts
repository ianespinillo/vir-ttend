import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IAcademicYearRepository } from '../../../domain/repositories/academic-year.repository.interface';
import { AcademicYearResponseDto } from '../../dtos/academic-year.response.dto';
import { UpdateAcademicYearCommand } from './update-academic-year.command';

@Injectable()
export class UpdateAcademicYearHandler {
	constructor(
		@Inject('IAcademicYearRepository')
		private readonly aYRepo: IAcademicYearRepository,
	) {}

	async execute(
		command: UpdateAcademicYearCommand,
	): Promise<AcademicYearResponseDto> {
		const period = await this.aYRepo.findById(command.academicYearId);
		if (!period) throw new NotFoundException('Academic year not found');

		if (command.year !== undefined && command.year !== period.year) {
			period.changeYear(command.year);
		}

		if (command.startDate || command.endDate) {
			const newStart = command.startDate ?? period.startDate;
			const newEnd = command.endDate ?? period.endDate;
			period.changeYearLapse(newStart, newEnd);
		}

		if (command.nonWorkingDays && command.nonWorkingDays.length > 0) {
			command.nonWorkingDays.forEach((d) => period.addNonWorkingDay(d));
		}

		period.updateThresholds(
			command.thresholds.absenceThresholdPercent,
			command.thresholds.lateCountAbscenseAfterMinutes,
		);

		if (command.isActive !== undefined) {
			if (command.isActive) {
				period.activate();
			} else {
				period.deactivate();
			}
		}

		await this.aYRepo.save(period);
		return new AcademicYearResponseDto(period);
	}
}
