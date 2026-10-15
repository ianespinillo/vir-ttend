import { Inject, Injectable } from '@nestjs/common';
import { STUDENTSTATUS } from '@repo/common';
import {
	BusinessRuleError,
	ConflictError,
	NotFoundError,
} from '../../../../../common/errors';
import { ICourseRepository } from '../../../domain/repositories/course.repository.interface';
import { IStudentRepository } from '../../../domain/repositories/student.repository.interface';
import { WorkshopPlacementService } from '../../services/workshop-placement.service';
import { EnrollStudentCommand } from './enroll-student.command';

@Injectable()
export class EnrollStudentHandler {
	constructor(
		@Inject('IStudentRepository')
		private readonly studentRepo: IStudentRepository,
		@Inject('ICourseRepository')
		private readonly courseRepo: ICourseRepository,
		private readonly placement: WorkshopPlacementService,
	) {}
	async execute(command: EnrollStudentCommand) {
		const student = await this.studentRepo.findById(command.studentId);
		if (!student) throw new NotFoundError('Estudiante no encontrado');

		const course = await this.courseRepo.findById(command.courseId);
		if (!course) throw new NotFoundError('Curso no encontrado');

		if (student.status === STUDENTSTATUS.TRANSFERRED) {
			throw new BusinessRuleError(
				'No se puede inscribir a un estudiante transferido.',
			);
		}

		if (student.courseId === command.courseId) {
			throw new ConflictError('El estudiante ya está inscripto en este curso.');
		}
		student.enrollInCourse(command.courseId);
		await this.placement.placeNewStudent(student);
		await this.studentRepo.save(student);
	}
}
