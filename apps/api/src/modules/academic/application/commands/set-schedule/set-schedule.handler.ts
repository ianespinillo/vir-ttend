import { Inject, Injectable } from '@nestjs/common';
import { DomainError, NotFoundError } from '../../../../../common/errors';
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
			if (!course) throw new NotFoundError('Curso no encontrado');

			const newSlots = command.slots.map((s) => {
				const slotSubjectId = s.subjectId ?? subjectId;
				if (!slotSubjectId)
					throw new DomainError('Cada horario debe indicar una materia.');
				return ScheduleSlot.create({
					dayOfWeek: s.dayOfWeek,
					startTime: s.startTime,
					endTime: s.endTime,
					subjectId: slotSubjectId,
					courseId,
					commissionNumber: s.commissionNumber ?? null,
				});
			});

			const courseSubjects = await this.subjetRepo.findByCourse(courseId);
			const workshopSubjectIds = new Set(
				courseSubjects.filter((s) => s.isWorkshop).map((s) => s.id.getRaw()),
			);
			CourseService.validateCommissionSlots(newSlots, workshopSubjectIds);
			CourseService.validateWeeklyHours(
				newSlots,
				new Map(courseSubjects.map((s) => [s.id.getRaw(), s.weeklyHours])),
				workshopSubjectIds,
			);
			CourseService.validateScheduleOverlap(newSlots);
			await this.scheduleRepo.deleteByCourse(courseId);
			if (newSlots.length > 0) {
				await this.scheduleRepo.saveMany(newSlots);
			}
			return;
		}

		if (!subjectId) {
			throw new DomainError('Debe indicar una materia o un curso.');
		}

		const subject = await this.subjetRepo.findById(subjectId);
		if (!subject) throw new NotFoundError('Materia no encontrada');
		const schedules = await this.scheduleRepo.findByCourse(subject.courseId);
		const filtered = schedules.filter((s) => s.subjectId !== subjectId);
		const newSlots = command.slots.map((s) =>
			ScheduleSlot.create({
				...s,
				subjectId,
				courseId: subject.courseId,
			}),
		);
		const workshopSubjectIds = new Set(
			subject.isWorkshop ? [subject.id.getRaw()] : [],
		);
		CourseService.validateCommissionSlots(newSlots, workshopSubjectIds);
		CourseService.validateWeeklyHours(
			newSlots,
			new Map([[subject.id.getRaw(), subject.weeklyHours]]),
			workshopSubjectIds,
		);
		CourseService.validateScheduleOverlap([...filtered, ...newSlots]);
		await this.scheduleRepo.deleteBySubject(subjectId);
		if (newSlots.length > 0) {
			await this.scheduleRepo.saveMany(newSlots);
		}
	}
}
