import { Inject, Injectable } from '@nestjs/common';
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
	): Promise<Date[]> {
		const academicYear =
			await this.academicYearRepository.findById(academicYearId);
		if (!academicYear) throw new Error('Academic Year not found');
		return this.scheduleService.getWorkingDaysOnPeriod(from, to, academicYear);
	}
	async findByCourse(courseId: string): Promise<ScheduleSlot[]> {
		const slots = await this.scheduleRepo.findByCourse(courseId);
		return slots.map((slot) =>
			ScheduleSlot.reconstitute(
				slot.subjectId,
				slot.dayOfWeek,
				slot.startTime,
				slot.endTime,
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
			),
		);
	}
}
