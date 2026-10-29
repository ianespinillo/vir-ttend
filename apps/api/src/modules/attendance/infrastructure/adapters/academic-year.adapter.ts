import { Inject, Injectable } from '@nestjs/common';
import { SHIFT } from '@repo/common';
import { IAcademicYearRepository } from '../../../academic/domain/repositories/academic-year.repository.interface';
import { ICourseRepository } from '../../../academic/domain/repositories/course.repository.interface';
import { AcademicYear } from '../../domain/entities/academic-year.entity';
import { IAcademicYearPort } from '../../domain/ports/academic-year.port.interface';
import { toDateKey } from '../../domain/services/weighted-absence';

@Injectable()
export class AcademicYearAdapter implements IAcademicYearPort {
	constructor(
		@Inject('IAcademicYearRepository')
		private readonly academicYearRepo: IAcademicYearRepository,
		@Inject('ICourseRepository')
		private readonly courseRepo: ICourseRepository,
	) {}

	async findActiveByTenant(tenantId: string): Promise<AcademicYear | null> {
		const year = await this.academicYearRepo.findActive(tenantId);
		if (!year) return null;
		return AcademicYear.reconstitute(
			year.id.getRaw(),
			year.absenceThresholdPercent,
			year.lateCountAbscenseAfterMinutes,
			year.startDate,
			year.endDate,
		);
	}
	async findById(id: string): Promise<AcademicYear | null> {
		const year = await this.academicYearRepo.findById(id);
		if (!year) return null;
		return AcademicYear.reconstitute(
			year.id.getRaw(),
			year.absenceThresholdPercent,
			year.lateCountAbscenseAfterMinutes,
			year.startDate,
			year.endDate,
		);
	}
	async findByCourseId(courseId: string): Promise<AcademicYear | null> {
		const course = await this.courseRepo.findById(courseId);
		if (!course) return null;
		return this.findById(course.academicYearId);
	}

	async getNonWorkingDays(
		academicYearId: string,
		shift: SHIFT | undefined,
		from: Date,
		to: Date,
	): Promise<string[]> {
		const year = await this.academicYearRepo.findById(academicYearId);
		if (!year) return [];
		const first = toDateKey(from);
		const last = toDateKey(to);
		return (year.nonWorkingDays ?? [])
			.filter((day) => year.isNonWorkingDayFor(day, shift))
			.map((day) => toDateKey(day))
			.filter((key) => key >= first && key <= last);
	}
}
