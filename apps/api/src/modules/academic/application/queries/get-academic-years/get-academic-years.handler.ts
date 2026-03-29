import { Injectable } from '@nestjs/common';
import { IAcademicYearRepository } from '../../../domain/repositories/academic-year.repository.interface';
import { AcademicYearResponseDto } from '../../dtos/academic-year.response.dto';
import { GetAcademicYearsQuery } from './get-academic-years.query';

@Injectable()
export class GetAcademicYearsHandler {
	constructor(private readonly academicYearsRepo: IAcademicYearRepository) {}
	async execute(query: GetAcademicYearsQuery): Promise<AcademicYearResponseDto> {
		const aY = await this.academicYearsRepo.findActive(query.schoolId);
		if (!aY) throw new Error('Academic year not found');
		return new AcademicYearResponseDto(aY);
	}
}
