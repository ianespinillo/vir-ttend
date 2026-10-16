import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError } from '../../../../../common/errors';
import { IAcademicYearRepository } from '../../../domain/repositories/academic-year.repository.interface';
import { AcademicYearResponseDto } from '../../dtos/academic-year.response.dto';
import { GetActiveAcademicYearQuery } from './get-active-academic-year.query';

@Injectable()
export class GetActiveAcademicYearHandler {
	constructor(
		@Inject('IAcademicYearRepository')
		private readonly aYRepo: IAcademicYearRepository,
	) {}
	async execute(
		query: GetActiveAcademicYearQuery,
	): Promise<AcademicYearResponseDto> {
		const aY = await this.aYRepo.findActive(query.schoolId);
		if (!aY) throw new NotFoundError('No hay un ciclo lectivo activo.');
		return new AcademicYearResponseDto(aY);
	}
}
