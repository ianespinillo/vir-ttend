import {
	BadRequestException,
	ConflictException,
	Inject,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { DomainError } from '../../../../../common/errors';
import { WorkshopCommission } from '../../../domain/entities/workshop-commission.entity';
import { IAcademicUnitOfWorkPort } from '../../../domain/ports/unit-of-work.port.interface';
import { ICourseRepository } from '../../../domain/repositories/course.repository.interface';
import { IStudentRepository } from '../../../domain/repositories/student.repository.interface';
import { IWorkshopCommissionRepository } from '../../../domain/repositories/workshop-commission.repository.interface';
import { WorkshopCommissionResponseDto } from '../../dtos/workshop-commission.response.dto';
import { assertCanManageCommissions } from '../../services/commission-access';
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
		@Inject('IAcademicUnitOfWorkPort')
		private readonly unitOfWork: IAcademicUnitOfWorkPort,
		private readonly placement: WorkshopPlacementService,
	) {}

	async execute(
		command: CreateWorkshopCommissionsCommand,
	): Promise<WorkshopCommissionResponseDto[]> {
		const numbers = this.numbersFor(command.count);
		const course = await this.courseRepo.findById(command.courseId);
		if (!course || course.tenantId !== command.tenantId)
			throw new NotFoundException('Curso no encontrado');
		assertCanManageCommissions(course, command.actorId, command.actorRole);

		const existing = await this.commissionRepo.findByCourse(command.courseId);
		if (existing.length > 0)
			throw new ConflictException('El curso ya tiene comisiones de taller.');

		return this.unitOfWork.run(async () => {
			const commissions: WorkshopCommission[] = [];
			for (const number of numbers) {
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

	private numbersFor(count: number) {
		try {
			return WorkshopCommission.numbersFor(count);
		} catch (error) {
			if (error instanceof DomainError)
				throw new BadRequestException(error.message);
			throw error;
		}
	}
}
