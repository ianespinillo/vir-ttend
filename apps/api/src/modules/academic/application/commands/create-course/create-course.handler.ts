import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
	BusinessRuleError,
	ConflictError,
	NotFoundError,
} from '../../../../../common/errors';
import { Course } from '../../../domain/entities/course.entity';
import { IAcademicYearRepository } from '../../../domain/repositories/academic-year.repository.interface';
import { ICourseRepository } from '../../../domain/repositories/course.repository.interface';
import { CourseCreatedEvent } from '../../../events/course-created.event';
import { CreateCourseCommand } from './create-course.command';

@Injectable()
export class CreateCourseHandler {
	constructor(
		@Inject('IAcademicYearRepository')
		private readonly aYRepo: IAcademicYearRepository,
		@Inject('ICourseRepository')
		private readonly courseRepo: ICourseRepository,
		private readonly em: EventEmitter2,
	) {}
	async execute(command: CreateCourseCommand): Promise<Course> {
		const period = await this.aYRepo.findById(command.academicYearId);
		if (!period) throw new NotFoundError('Ciclo lectivo no encontrado');
		if (!period.isActive)
			throw new BusinessRuleError('El ciclo lectivo no está activo.');
		const exist = await this.courseRepo.findByAcademicYearAndDivision(
			command.academicYearId,
			command.yearNumber,
			command.division,
			command.shift,
		);
		if (exist)
			throw new ConflictError(
				'Ya existe un curso con ese año, división y turno en el ciclo lectivo.',
			);
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
