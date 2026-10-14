import {
	ConflictException,
	Inject,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { COMMISSION_NUMBERS } from '@repo/common';
import { WorkshopCommission } from '../../../domain/entities/workshop-commission.entity';
import { IUnitOfWorkPort } from '../../../domain/ports/unit-of-work.port.interface';
import { ICourseRepository } from '../../../domain/repositories/course.repository.interface';
import { IStudentRepository } from '../../../domain/repositories/student.repository.interface';
import { IWorkshopCommissionRepository } from '../../../domain/repositories/workshop-commission.repository.interface';
import { WorkshopCommissionResponseDto } from '../../dtos/workshop-commission.response.dto';
import { WorkshopPlacementService } from '../../services/workshop-placement.service';
import { CreateWorkshopCommissionsCommand } from './create-workshop-commissions.command';

@Injectable()
export class CreateWorkshopCommissionsHandler {
	constructor(
		@Inject('ICourseRepository')
		private readonly courseRepo: ICourseRepository,
		@Inject('IStudentRepository')
		private readonly studentRepo: IStudentRepository,
		@Inject('IWorkshopCommissionRepository')
		private readonly commissionRepo: IWorkshopCommissionRepository,
		@Inject('IUnitOfWorkPort')
		private readonly unitOfWork: IUnitOfWorkPort,
		private readonly placement: WorkshopPlacementService,
	) {}

	async execute(
		command: CreateWorkshopCommissionsCommand,
	): Promise<WorkshopCommissionResponseDto[]> {
		const course = await this.courseRepo.findById(command.courseId);
		if (!course || course.tenantId !== command.tenantId)
			throw new NotFoundException('Curso no encontrado');

		const existing = await this.commissionRepo.findByCourse(command.courseId);
		if (existing.length > 0)
			throw new ConflictException('El curso ya tiene comisiones de taller.');

		return this.unitOfWork.run(async () => {
			const commissions: WorkshopCommission[] = [];
			for (const number of COMMISSION_NUMBERS) {
				const commission = WorkshopCommission.create({
					tenantId: course.tenantId,
					courseId: command.courseId,
					number,
				});
				await this.commissionRepo.save(commission);
				commissions.push(commission);
			}
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
