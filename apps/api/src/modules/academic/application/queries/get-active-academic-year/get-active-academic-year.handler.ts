import { Injectable } from '@nestjs/common';
import { IAcademicYearRepository } from '../../../domain/repositories/academic-year.repository.interface';
import { AcademicYearResponseDto } from '../../dtos/academic-year.response.dto';
import { GetActiveAcademicYearQuery } from './get-active-academic-year.query';

@Injectable()
export class GetActiveAcademicYearHandler {
	constructor(private readonly aYRepo: IAcademicYearRepository) {}
	async execute(
		query: GetActiveAcademicYearQuery,
	): Promise<AcademicYearResponseDto> {
		const aY = await this.aYRepo.findActive(query.schoolId);
		if (!aY) throw new Error('Active academic year not found');
		return new AcademicYearResponseDto(aY);
	}
}
