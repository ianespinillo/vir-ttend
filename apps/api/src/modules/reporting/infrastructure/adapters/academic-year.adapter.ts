import { Inject, Injectable } from '@nestjs/common';
import { IAcademicYearRepository } from '../../../academic/domain/repositories/academic-year.repository.interface';
import { AcademicYear } from '../../domain/entities/academic-year.entity';
import { IAcademicYearPort } from '../../domain/ports/academic-year.port.interface';

@Injectable()
export class AcademicYearAdapter implements IAcademicYearPort {
	constructor(
		@Inject('IAcademicYearRepository')
		private readonly academicYearRepo: IAcademicYearRepository,
	) {}
	async findById(id: string): Promise<AcademicYear | null> {
		const year = await this.academicYearRepo.findById(id);
		if (!year) return null;
		return AcademicYear.reconstitute({
			id: year.id.getRaw(),
			tenantId: year.tenantId,
			year: year.year,
			startDate: year.startDate,
			endDate: year.endDate,
		});
	}
	async getWorkingDaysBYAcademicYear(academicYearId: string): Promise<number> {
		const year = await this.academicYearRepo.findById(academicYearId);
		if (!year) return 0;
		const totalDays = Math.ceil(
			(year.endDate.getTime() - year.startDate.getTime()) / (1000 * 60 * 60 * 24),
		);
		const nonWorkingDays = year.nonWorkingDays?.length ?? 0;
		return totalDays - nonWorkingDays;
	}
}
