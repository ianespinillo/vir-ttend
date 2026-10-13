import { Inject, Injectable } from '@nestjs/common';
import { ScheduleSlot } from '../../../domain/entities/schedule-slot.entity';
import { ICourseRepository } from '../../../domain/repositories/course.repository.interface';
import { IScheduleRepository } from '../../../domain/repositories/schedule.repository.interface';
import { ISubjectRepository } from '../../../domain/repositories/subject.repository.interface';
import { CourseService } from '../../../domain/services/course.service';
import { ScheduleService } from '../../../domain/services/schedule.service';
import { SetScheduleCommand } from './set-schedule.command';

@Injectable()
export class SetScheduleHandler {
	constructor(
		@Inject('IScheduleRepository')
		private readonly scheduleRepo: IScheduleRepository,
		@Inject('ISubjectRepository')
		private readonly subjetRepo: ISubjectRepository,
		@Inject('ICourseRepository')
		private readonly courseRepo: ICourseRepository,
	) {}
	async execute(command: SetScheduleCommand) {
		const { courseId, subjectId } = command;
		if (courseId) {
			const course = await this.courseRepo.findById(courseId);
			if (!course) throw new Error('Course not found');

			const newSlots = command.slots.map((s) => {
				const slotSubjectId = s.subjectId ?? subjectId;
				if (!slotSubjectId) throw new Error('Slot must have a subjectId');
				return ScheduleSlot.create({
					dayOfWeek: s.dayOfWeek,
					startTime: s.startTime,
					endTime: s.endTime,
					subjectId: slotSubjectId,
					courseId,
				});
			});

			const courseSubjects = await this.subjetRepo.findByCourse(courseId);
			CourseService.validateWeeklyHours(
				newSlots,
				new Map(courseSubjects.map((s) => [s.id.getRaw(), s.weeklyHours])),
			);
			CourseService.validateScheduleOverlap(newSlots);
			await this.scheduleRepo.deleteByCourse(courseId);
			if (newSlots.length > 0) {
				await this.scheduleRepo.saveMany(newSlots);
			}
			return;
		}

		if (!subjectId) {
			throw new Error('Subject or course must be specified');
		}

		const subject = await this.subjetRepo.findById(subjectId);
		if (!subject) throw new Error('Subject not found');
		const schedules = await this.scheduleRepo.findByCourse(subject.courseId);
		const filtered = schedules.filter((s) => s.subjectId !== subjectId);
		const newSlots = command.slots.map((s) =>
			ScheduleSlot.create({
				...s,
				subjectId,
				courseId: subject.courseId,
			}),
		);
		CourseService.validateWeeklyHours(
			newSlots,
			new Map([[subject.id.getRaw(), subject.weeklyHours]]),
		);
		CourseService.validateScheduleOverlap([...filtered, ...newSlots]);
		await this.scheduleRepo.deleteBySubject(subjectId);
		if (newSlots.length > 0) {
			await this.scheduleRepo.saveMany(newSlots);
		}
	}
}
