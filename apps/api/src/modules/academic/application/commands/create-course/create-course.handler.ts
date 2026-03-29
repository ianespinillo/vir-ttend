import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Course } from '../../../domain/entities/course.entity';
import { IAcademicYearRepository } from '../../../domain/repositories/academic-year.repository.interface';
import { ICourseRepository } from '../../../domain/repositories/course.repository.interface';
import { CourseCreatedEvent } from '../../../events/course-created.event';
import { CreateCourseCommand } from './create-course.command';

@Injectable()
export class CreateCourseHandler {
	constructor(
		private readonly aYRepo: IAcademicYearRepository,
		private readonly courseRepo: ICourseRepository,
		private readonly em: EventEmitter2,
	) {}
	async execute(command: CreateCourseCommand): Promise<Course> {
		const period = await this.aYRepo.findById(command.academicYearId);
		if (!period?.isActive) throw new Error('Invalid academic year');
		const exist = await this.courseRepo.findByAcademicYearAndDivision(
			command.academicYearId,
			command.yearNumber,
			command.division,
			command.shift,
		);
		if (exist) throw new Error('Course already exists');
		const course = Course.create({ ...command, tenantId: command.schoolId });
		await this.courseRepo.save(course);
		this.em.emit(
			'course.created',
			new CourseCreatedEvent(
				course.id,
				course.tenantId,
				course.academicYearId,
				course.yearNumber,
				course.division,
				course.shift,
				course.level,
			),
		);
		return course;
	}
}
