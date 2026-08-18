import { Inject, Injectable } from '@nestjs/common';
import { IAcademicYearRepository } from '../../../domain/repositories/academic-year.repository.interface';
import { AcademicYearResponseDto } from '../../dtos/academic-year.response.dto';
import { GetAcademicYearsQuery } from './get-academic-years.query';

@Injectable()
export class GetAcademicYearsHandler {
	constructor(
		@Inject('IAcademicYearRepository')
		private readonly academicYearsRepo: IAcademicYearRepository,
	) {}
	async execute(
		query: GetAcademicYearsQuery,
	): Promise<AcademicYearResponseDto[]> {
		const aYs = await this.academicYearsRepo.findBySchool(query.schoolId);
		return aYs.map((aY) => new AcademicYearResponseDto(aY));
	}
}
