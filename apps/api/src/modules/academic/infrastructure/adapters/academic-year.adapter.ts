import { Injectable } from '@nestjs/common';
import { IAcademicYearModel } from '../../../attendance/application/models/academic-year.model';
import { IAcademicYearPort } from '../../../attendance/domain/ports/academic-year.port.interface';
import { IAcademicYearRepository } from '../../domain/repositories/academic-year.repository.interface';

@Injectable()
export class AcademicYearAdapter implements IAcademicYearPort {
	constructor(private readonly academicYearRepo: IAcademicYearRepository) {}

	async findActiveByTenant(
		tenantId: string,
	): Promise<IAcademicYearModel | null> {
		const year = await this.academicYearRepo.findActive(tenantId);
		if (!year) return null;
		return {
			absenceThresholdPercent: year.absenceThresholdPercent,
			endDate: year.endDate,
			lateCountAbscenseAfterMinutes: year.lateCountAbscenseAfterMinutes,
			nonWorkingDays: year.nonWorkingDays,
			startDate: year.startDate,
			id: year.id.getRaw(),
		};
	}
}
