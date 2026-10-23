import { Inject, Injectable } from '@nestjs/common';
import { SHIFT } from '@repo/common';
import { NotFoundError } from '../../../../common/errors';
import { IAcademicYearRepository } from '../../../academic/domain/repositories/academic-year.repository.interface';
import { IScheduleRepository } from '../../../academic/domain/repositories/schedule.repository.interface';
import { ScheduleService } from '../../../academic/domain/services/schedule.service';
import { ScheduleSlot } from '../../domain/entities/schedule-slot.entity';
import { ISchedulePort } from '../../domain/ports/schedule.port.interface';

@Injectable()
export class ScheduleAdapter implements ISchedulePort {
	constructor(
		@Inject('IScheduleRepository')
		private readonly scheduleRepo: IScheduleRepository,
		@Inject('IAcademicYearRepository')
		private readonly academicYearRepository: IAcademicYearRepository,
		private readonly scheduleService: ScheduleService,
	) {}
	async getWorkingDaysOnPeriod(
		from: Date,
		to: Date,
		academicYearId: string,
		shift?: SHIFT,
	): Promise<Date[]> {
		const academicYear =
			await this.academicYearRepository.findById(academicYearId);
		if (!academicYear) throw new NotFoundError('Ciclo lectivo no encontrado');
		return this.scheduleService.getWorkingDaysOnPeriod(
			from,
			to,
			academicYear,
			shift,
		);
	}
	async findByCourse(courseId: string): Promise<ScheduleSlot[]> {
		const slots = await this.scheduleRepo.findByCourse(courseId);
		return slots.map((slot) =>
			ScheduleSlot.reconstitute(
				slot.subjectId,
				slot.dayOfWeek,
				slot.startTime,
				slot.endTime,
				slot.commissionNumber,
			),
		);
	}
	async findBySubject(subjectId: string): Promise<ScheduleSlot[]> {
		const slots = await this.scheduleRepo.findBySubject(subjectId);
		return slots.map((slot) =>
			ScheduleSlot.reconstitute(
				slot.subjectId,
				slot.dayOfWeek,
				slot.startTime,
				slot.endTime,
				slot.commissionNumber,
			),
		);
	}
}
