import { Inject, Injectable } from '@nestjs/common';
import { SHIFT } from '@repo/common';
import { AcademicYear as AcademicYearAggregate } from '../../../academic/domain/entities/academic-year.entity';
import { IAcademicYearRepository } from '../../../academic/domain/repositories/academic-year.repository.interface';
import { IDailySessionNotHeldRepository } from '../../../attendance/domain/repositories/daily-session-not-held.repository.interface';
import { toDateKey } from '../../../attendance/domain/services/weighted-absence';
import { AcademicYear } from '../../domain/entities/academic-year.entity';
import { IAcademicYearPort } from '../../domain/ports/academic-year.port.interface';

@Injectable()
export class AcademicYearAdapter implements IAcademicYearPort {
	constructor(
		@Inject('IAcademicYearRepository')
		private readonly academicYearRepo: IAcademicYearRepository,
		@Inject('IDailySessionNotHeldRepository')
		private readonly notHeldRepo: IDailySessionNotHeldRepository,
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
	async getWorkingDaysBYAcademicYear(
		academicYearId: string,
		shift?: SHIFT,
		courseId?: string,
	): Promise<number> {
		const year = await this.academicYearRepo.findById(academicYearId);
		if (!year) return 0;
		const totalDays = Math.ceil(
			(year.endDate.getTime() - year.startDate.getTime()) / (1000 * 60 * 60 * 24),
		);
		// A day scoped to other shifts is still a working day for this course.
		const nonWorkingDays = (year.nonWorkingDays ?? []).filter((d) =>
			year.isNonWorkingDayFor(d, shift),
		).length;
		const theoryNotHeld = courseId
			? await this.countTheoryNotHeldOnWorkingDays(year, shift, courseId)
			: 0;
		return totalDays - nonWorkingDays - theoryNotHeld;
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

	/**
	 * Days the course's theory was marked as not held that the institution had
	 * not already suspended for the shift, so no day is subtracted twice.
	 */
	private async countTheoryNotHeldOnWorkingDays(
		year: AcademicYearAggregate,
		shift: SHIFT | undefined,
		courseId: string,
	): Promise<number> {
		const markers = await this.notHeldRepo.findByCourseAndDateRange(
			courseId,
			year.startDate,
			year.endDate,
		);
		return markers.filter(
			(marker) => !year.isNonWorkingDayFor(marker.date, shift),
		).length;
	}
}
