import { Injectable } from '@nestjs/common';
import { ScheduleSlot } from '../../../domain/entities/schedule-slot.entity';
import { IScheduleRepository } from '../../../domain/repositories/schedule.repository.interface';
import { ISubjectRepository } from '../../../domain/repositories/subject.repository.interface';
import { CourseService } from '../../../domain/services/course.service';
import { ScheduleService } from '../../../domain/services/schedule.service';
import { SetScheduleCommand } from './set-schedule.command';

@Injectable()
export class SetScheduleHandler {
	constructor(
		private readonly scheduleRepo: IScheduleRepository,
		private readonly subjetRepo: ISubjectRepository,
	) {}
	async execute(command: SetScheduleCommand) {
		const subject = await this.subjetRepo.findById(command.subjectId);
		if (!subject) throw new Error('Subject not found');
		const schedules = await this.scheduleRepo.findByCourse(subject.courseId);
		const filtered = schedules.filter((s) => s.subjectId !== command.subjectId);
		const newSlots = command.slots.map((s) =>
			ScheduleSlot.create({
				...s,
				subjectId: command.subjectId,
			}),
		);
		CourseService.validateScheduleOverlap([...filtered, ...newSlots]);
		await this.scheduleRepo.deleteBySubject(command.subjectId);
		await this.scheduleRepo.saveMany(newSlots);
	}
}
