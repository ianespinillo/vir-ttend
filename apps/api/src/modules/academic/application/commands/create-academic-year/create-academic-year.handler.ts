import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AcademicYear } from '../../../domain/entities/academic-year.entity';
import { IAcademicYearRepository } from '../../../domain/repositories/academic-year.repository.interface';
import { AcademicYearCreatedEvent } from '../../../events/academic-year-created.event';
import { AcademicYearResponseDto } from '../../dtos/academic-year.response.dto';
import { CreateAcademicYearCommand } from './create-academic-year.command';

@Injectable()
export class CreateAcademicYearHandler {
	constructor(
		private readonly aYRepo: IAcademicYearRepository,
		private readonly em: EventEmitter2,
	) {}
	async execute(
		command: CreateAcademicYearCommand,
	): Promise<AcademicYearResponseDto> {
		const { schoolId, year } = command;
		const exists = await this.aYRepo.findBySchoolAndYear(schoolId, year);
		if (exists) throw new Error('Existent academic period with this config');
		const period = AcademicYear.create({
			...command,
			tenantId: schoolId,
		});
		await this.aYRepo.save(period);
		this.em.emit(
			'academic-year.created',
			new AcademicYearCreatedEvent(
				period.id.getRaw(),
				period.tenantId,
				period.year,
				period.startDate,
				period.endDate,
			),
		);
		return new AcademicYearResponseDto(period);
	}
}
