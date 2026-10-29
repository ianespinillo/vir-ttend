import { UniqueConstraintViolationException } from '@mikro-orm/core';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DomainError, NotFoundError } from '../../../../../common/errors';
import { AttendanceAlert } from '../../../domain/entities/attendance-alert.entity';
import { IAcademicYearPort } from '../../../domain/ports/academic-year.port.interface';
import { ICoursePort } from '../../../domain/ports/courses.port.interface';
import { IAttendanceAlertRepository } from '../../../domain/repositories/attendance-alert.repository.interface';
import { ThresholdCheckerService } from '../../../domain/services/threshold-checker.service';
import { StudentWeightedAbsencesService } from '../../services/student-weighted-absences.service';
import { GenerateAlertCommand } from './generate-alert.command';

/**
 * Raises the absence alert of a student when the weighted absence count
 * reaches 10, 20 or the student's cap, justified or not.
 */
@Injectable()
export class GenerateAlertHandler {
	private readonly logger = new Logger(GenerateAlertHandler.name);

	constructor(
		@Inject('IAcademicYearPort')
		private readonly academicPort: IAcademicYearPort,
		@Inject('ICoursePort')
		private readonly coursePort: ICoursePort,
		private readonly weightedAbsences: StudentWeightedAbsencesService,
		@Inject('IAttendanceAlertRepository')
		private readonly alertRepo: IAttendanceAlertRepository,
		private readonly em: EventEmitter2,
	) {}
	async execute(command: GenerateAlertCommand): Promise<void> {
		const year = await this.academicPort.findById(command.academicYearId);
		if (!year) throw new NotFoundError('Ciclo lectivo no encontrado');
		const course = await this.coursePort.findById(command.courseId);
		if (!course) throw new NotFoundError('Curso no encontrado');
		if (course.academicYearId !== command.academicYearId)
			throw new DomainError('El curso no pertenece al ciclo lectivo indicado');
		const { total, cap } =
			await this.weightedAbsences.getStudentWeightedAbsencesForAlert(
				command.studentId,
				command.academicYearId,
				command.triggerDate,
				{ workshopOnly: course.isWorkshopOnly, courseId: command.courseId },
			);
		const alerts = await this.alertRepo.findByStudentId(command.studentId);
		const currentYearAlerts = alerts.filter(
			(alert) => alert.academicYearId === command.academicYearId,
		);
		const reached = ThresholdCheckerService.check(total, cap, currentYearAlerts);
		if (!reached) return;
		const alert = AttendanceAlert.create({
			academicYearId: command.academicYearId,
			tenantId: command.tenantId,
			alertType: reached.alertType,
			absenceCount: total,
			threshold: reached.threshold,
			courseId: command.courseId,
			studentId: command.studentId,
		});
		try {
			await this.alertRepo.save(alert);
		} catch (error) {
			// A concurrent evaluation saved the same alert first (unique index on
			// student, academic year and type): already alerted.
			if (!(error instanceof UniqueConstraintViolationException)) throw error;
			this.logger.debug(
				`Alert ${reached.alertType.status} already raised for student ${command.studentId}`,
			);
			return;
		}
		this.em.emit('alert.triggered', alert);
	}
}
