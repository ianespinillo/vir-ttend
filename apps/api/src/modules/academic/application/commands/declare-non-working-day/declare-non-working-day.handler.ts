import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundError } from '../../../../../common/errors';
import { IAcademicYearRepository } from '../../../domain/repositories/academic-year.repository.interface';
import { NonWorkingDayDeclaredEvent } from '../../../events/non-working-day-declared.event';
import { AcademicYearResponseDto } from '../../dtos/academic-year.response.dto';
import { DeclareNonWorkingDayCommand } from './declare-non-working-day.command';

@Injectable()
export class DeclareNonWorkingDayHandler {
	constructor(
		@Inject('IAcademicYearRepository')
		private readonly aYRepo: IAcademicYearRepository,
		private readonly em: EventEmitter2,
	) {}

	async execute(
		command: DeclareNonWorkingDayCommand,
	): Promise<AcademicYearResponseDto> {
		const period = await this.aYRepo.findById(command.academicYearId);
		if (!period || period.tenantId !== command.tenantId) {
			throw new NotFoundError('Ciclo lectivo no encontrado');
		}

		const date = new Date(command.date);
		if (Number.isNaN(date.getTime())) {
			throw new BadRequestException('Fecha inválida');
		}

		period.declareNonWorkingDay(date, command.shifts);
		await this.aYRepo.save(period);

		if (command.notifySchool) {
			this.em.emit(
				'non-working-day.declared',
				new NonWorkingDayDeclaredEvent(
					period.id.getRaw(),
					period.tenantId,
					date,
					command.reason,
					command.authorId,
					command.type,
					command.shifts,
				),
			);
		}

		return new AcademicYearResponseDto(period);
	}
}
