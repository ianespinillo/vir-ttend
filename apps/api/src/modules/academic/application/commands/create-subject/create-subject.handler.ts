import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Subject } from '../../../domain/entities/subject.entity';
import { ICourseRepository } from '../../../domain/repositories/course.repository.interface';
import { ISubjectRepository } from '../../../domain/repositories/subject.repository.interface';
import { SubjectCreatedEvent } from '../../../events/subject-created.event';
import { IMembershipPort } from '../../ports/identity/membership.port.interface';
import { CreateSubjectCommand } from './create-subject.command';

@Injectable()
export class CreateSubjectHandler {
	constructor(
		private readonly subjectRepo: ISubjectRepository,
		private readonly courseRepo: ICourseRepository,
		private readonly membershipPort: IMembershipPort,
		private readonly em: EventEmitter2,
	) {}
	async execute(command: CreateSubjectCommand) {
		const course = await this.courseRepo.findById(command.courseId);
		if (!course) throw new Error('Course not found');
		const belongs = await this.membershipPort.belongsToTenant(
			command.teacherId,
			course.tenantId,
		);
		if (!belongs) throw new Error("Teaccher doesn't belongs to tenant");
		const subjects = await this.subjectRepo.findByCourse(command.courseId);
		const newSubject = Subject.create({ ...command });
		const exist = subjects.some((s) => newSubject.equals(s));
		if (exist) throw new Error('Subject already exists');
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
