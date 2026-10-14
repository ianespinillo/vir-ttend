import {
	BadRequestException,
	Inject,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { IAcademicUnitOfWorkPort } from '../../../domain/ports/unit-of-work.port.interface';
import { ICourseRepository } from '../../../domain/repositories/course.repository.interface';
import { IStudentRepository } from '../../../domain/repositories/student.repository.interface';
import { IWorkshopCommissionRepository } from '../../../domain/repositories/workshop-commission.repository.interface';
import { WorkshopCommissionResponseDto } from '../../dtos/workshop-commission.response.dto';
import { WorkshopPlacementService } from '../../services/workshop-placement.service';
import { RegenerateWorkshopCommissionsCommand } from './regenerate-workshop-commissions.command';

@Injectable()
export class RegenerateWorkshopCommissionsHandler {
	constructor(
		@Inject('ICourseRepository')
		private readonly courseRepo: ICourseRepository,
		@Inject('IStudentRepository')
		private readonly studentRepo: IStudentRepository,
		@Inject('IWorkshopCommissionRepository')
		private readonly commissionRepo: IWorkshopCommissionRepository,
		@Inject('IAcademicUnitOfWorkPort')
		private readonly unitOfWork: IAcademicUnitOfWorkPort,
		private readonly placement: WorkshopPlacementService,
	) {}

	async execute(
		command: RegenerateWorkshopCommissionsCommand,
	): Promise<WorkshopCommissionResponseDto[]> {
		if (command.confirm !== true)
			throw new BadRequestException(
				'Debe confirmar la regeneración: mueve estudiantes con historial.',
			);
		const course = await this.courseRepo.findById(command.courseId);
		if (!course || course.tenantId !== command.tenantId)
			throw new NotFoundException('Curso no encontrado');

		const commissions = await this.commissionRepo.findByCourse(command.courseId);
		if (commissions.length === 0)
			throw new NotFoundException('El curso no tiene comisiones de taller.');

		return this.unitOfWork.run(async () => {
			const students = await this.studentRepo.findActiveByCourse(command.courseId);
			await this.placement.applySplit(commissions, students);
			return commissions.map(
				(c) =>
					new WorkshopCommissionResponseDto(
						c,
						course,
						students.filter((s) => s.workshopCommissionId === c.id),
					),
			);
		});
	}
}
