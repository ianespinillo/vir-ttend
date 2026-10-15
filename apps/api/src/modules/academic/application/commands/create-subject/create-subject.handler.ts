import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
	ConflictError,
	DomainError,
	NotFoundError,
} from '../../../../../common/errors';
import { Subject } from '../../../domain/entities/subject.entity';
import { IMembershipPort } from '../../../domain/ports/membership.port.interface';
import { ICourseRepository } from '../../../domain/repositories/course.repository.interface';
import { ISubjectRepository } from '../../../domain/repositories/subject.repository.interface';
import { SubjectCreatedEvent } from '../../../events/subject-created.event';
import { CreateSubjectCommand } from './create-subject.command';

@Injectable()
export class CreateSubjectHandler {
	constructor(
		@Inject('ISubjectRepository')
		private readonly subjectRepo: ISubjectRepository,
		@Inject('ICourseRepository')
		private readonly courseRepo: ICourseRepository,
		@Inject('IMembershipPort')
		private readonly membershipPort: IMembershipPort,
		private readonly em: EventEmitter2,
	) {}
	async execute(command: CreateSubjectCommand) {
		const course = await this.courseRepo.findById(command.courseId);
		if (!course) throw new NotFoundError('Curso no encontrado');
		const belongs = await this.membershipPort.belongsToTenant(
			command.teacherId,
			course.tenantId,
		);
		if (!belongs) throw new DomainError('El docente no pertenece a la escuela.');
		const subjects = await this.subjectRepo.findByCourse(command.courseId);
		const newSubject = Subject.create({ ...command });
		const exist = subjects.some((s) => newSubject.equals(s));
		if (exist) throw new ConflictError('Ya existe esa materia en el curso.');
		await this.subjectRepo.save(newSubject);
		this.em.emit(
			'subject.created',
			new SubjectCreatedEvent(
				newSubject.id.getRaw(),
				newSubject.courseId,
				newSubject.teacherId,
				newSubject.name,
				newSubject.area,
				newSubject.weeklyHours,
			),
		);
	}
}
