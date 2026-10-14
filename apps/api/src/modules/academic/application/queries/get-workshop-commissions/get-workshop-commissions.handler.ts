import {
	ForbiddenException,
	Inject,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { ROLES } from '@repo/common';
import { ICourseRepository } from '../../../domain/repositories/course.repository.interface';
import { IStudentRepository } from '../../../domain/repositories/student.repository.interface';
import { IWorkshopCommissionRepository } from '../../../domain/repositories/workshop-commission.repository.interface';
import { WorkshopCommissionResponseDto } from '../../dtos/workshop-commission.response.dto';
import { GetWorkshopCommissionsQuery } from './get-workshop-commissions.query';

@Injectable()
export class GetWorkshopCommissionsHandler {
	constructor(
		@Inject('ICourseRepository')
		private readonly courseRepo: ICourseRepository,
		@Inject('IStudentRepository')
		private readonly studentRepo: IStudentRepository,
		@Inject('IWorkshopCommissionRepository')
		private readonly commissionRepo: IWorkshopCommissionRepository,
	) {}

	async execute(
		query: GetWorkshopCommissionsQuery,
	): Promise<WorkshopCommissionResponseDto[]> {
		const course = await this.courseRepo.findById(query.courseId);
		if (!course || course.tenantId !== query.tenantId)
			throw new NotFoundException('Curso no encontrado');

		const commissions = await this.commissionRepo.findByCourse(query.courseId);
		if (commissions.length === 0) return [];

		if (query.role === ROLES.PRECEPTOR) {
			const allowed =
				course.preceptorId === query.userId ||
				commissions.some((c) => c.preceptorId === query.userId);
			if (!allowed)
				throw new ForbiddenException('No tiene acceso a las comisiones del curso.');
		}

		const students = await this.studentRepo.findActiveByCourse(query.courseId);
		return commissions.map(
			(c) =>
				new WorkshopCommissionResponseDto(
					c,
					course,
					students.filter((s) => s.workshopCommissionId === c.id),
				),
		);
	}
}
