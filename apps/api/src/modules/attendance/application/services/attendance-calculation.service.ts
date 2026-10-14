import { Inject, Injectable } from '@nestjs/common';
import { ISchedulePort } from '../../domain/ports/schedule.port.interface';
import { dayOfWeekOf } from '../../domain/services/day-of-week.util';

@Injectable()
export class AttendanceCalculationService {
	constructor(
		@Inject('ISchedulePort')
		private readonly schedulePort: ISchedulePort,
	) {}
	async getExpectedClassesForSubject(
		subjectId: string,
		from: Date,
		to: Date,
		academicYearId: string,
	): Promise<number> {
		const workingDays = await this.schedulePort.getWorkingDaysOnPeriod(
			from,
			to,
			academicYearId,
		);
		const slots = await this.schedulePort.findBySubject(subjectId);
		const classDaysOfWeek = new Set(slots.map((s) => s.dayOfWeek));
		const expectedClasses = workingDays.filter((d) => {
			const weekday = dayOfWeekOf(d);
			return weekday !== undefined && classDaysOfWeek.has(weekday);
		});
		return expectedClasses.length;
	}
	async getExpectedClassesForCourse(
		from: Date,
		to: Date,
		courseId: string,
		academicYearId: string,
	): Promise<number> {
		const workingDays = await this.schedulePort.getWorkingDaysOnPeriod(
			from,
			to,
			academicYearId,
		);
		const slots = await this.schedulePort.findByCourse(courseId);
		const classDaysOfWeek = new Set(slots.map((s) => s.dayOfWeek));
		const expectedClasses = workingDays.filter((d) => {
			const weekday = dayOfWeekOf(d);
			return weekday !== undefined && classDaysOfWeek.has(weekday);
		});
		return expectedClasses.length;
	}
}
