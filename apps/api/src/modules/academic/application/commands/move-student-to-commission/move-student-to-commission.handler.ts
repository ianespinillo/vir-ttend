import {
	BadRequestException,
	Inject,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { STUDENTSTATUS } from '@repo/common';
import { IStudentRepository } from '../../../domain/repositories/student.repository.interface';
import { IWorkshopCommissionRepository } from '../../../domain/repositories/workshop-commission.repository.interface';
import { MoveStudentToCommissionCommand } from './move-student-to-commission.command';

@Injectable()
export class MoveStudentToCommissionHandler {
	constructor(
		@Inject('IWorkshopCommissionRepository')
		private readonly commissionRepo: IWorkshopCommissionRepository,
		@Inject('IStudentRepository')
		private readonly studentRepo: IStudentRepository,
	) {}

	async execute(command: MoveStudentToCommissionCommand): Promise<void> {
		const commission = await this.commissionRepo.findById(command.commissionId);
		if (!commission || commission.tenantId !== command.tenantId)
			throw new NotFoundException('Comisión no encontrada');
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
