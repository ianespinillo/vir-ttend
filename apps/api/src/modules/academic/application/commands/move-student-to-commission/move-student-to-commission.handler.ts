import {
	BadRequestException,
	Inject,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { ROLES, STUDENTSTATUS } from '@repo/common';
import { ICourseRepository } from '../../../domain/repositories/course.repository.interface';
import { IStudentRepository } from '../../../domain/repositories/student.repository.interface';
import { IWorkshopCommissionRepository } from '../../../domain/repositories/workshop-commission.repository.interface';
import { assertCanManageCommissions } from '../../services/commission-access';
import { MoveStudentToCommissionCommand } from './move-student-to-commission.command';

@Injectable()
export class MoveStudentToCommissionHandler {
	constructor(
		@Inject('IWorkshopCommissionRepository')
		private readonly commissionRepo: IWorkshopCommissionRepository,
		@Inject('IStudentRepository')
		private readonly studentRepo: IStudentRepository,
		@Inject('ICourseRepository')
		private readonly courseRepo: ICourseRepository,
	) {}

	async execute(command: MoveStudentToCommissionCommand): Promise<void> {
		const commission = await this.commissionRepo.findById(command.commissionId);
		if (!commission || commission.tenantId !== command.tenantId)
			throw new NotFoundException('Comisión no encontrada');
		if (command.actorRole === ROLES.PRECEPTOR) {
			const course = await this.courseRepo.findById(commission.courseId);
			if (!course || course.tenantId !== command.tenantId)
				throw new NotFoundException('Curso no encontrado');
			assertCanManageCommissions(course, command.actorId, command.actorRole);
		}
		const student = await this.studentRepo.findById(command.studentId);
		if (!student || student.tenantId !== command.tenantId)
			throw new NotFoundException('Estudiante no encontrado');

		if (student.courseId !== commission.courseId)
			throw new BadRequestException(
				'El estudiante no pertenece al curso de la comisión.',
			);
		if (student.status !== STUDENTSTATUS.ACTIVE)
			throw new BadRequestException('El estudiante no está activo.');

		if (student.workshopCommissionId === commission.id) return;
		student.assignWorkshopCommission(commission.id);
		await this.studentRepo.save(student);
	}
}
