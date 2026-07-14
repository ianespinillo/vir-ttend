import { BadRequestException, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AttendanceAlert } from '../../../domain/entities/attendance-alert.entity';
import { IAcademicYearPort } from '../../../domain/ports/academic-year.port.interface';
import { ICoursePort } from '../../../domain/ports/courses.port.interface';
import { IAttendanceAlertRepository } from '../../../domain/repositories/attendance-alert.repository.interface';
import { IAttendanceRecordRepository } from '../../../domain/repositories/attendance-record.repository.interface';
import { AttendanceCalculationService } from '../../../domain/services/attendance-calculation.service';
import { ThresholdCheckerService } from '../../../domain/services/threshold-checker.service';
import { GenerateAlertCommand } from './generate-alert.command';

@Injectable()
export class GenerateAlertHandler {
	constructor(
		private readonly academicPort: IAcademicYearPort,
		private readonly coursePort: ICoursePort,
		private readonly attendanceService: AttendanceCalculationService,
		private readonly attendanceRepo: IAttendanceRecordRepository,
		private readonly alertRepo: IAttendanceAlertRepository,
		private readonly em: EventEmitter2,
	) {}
	async execute(command: GenerateAlertCommand): Promise<void> {
		const year = await this.academicPort.findById(command.academicYearId);
		if (!year) throw new BadRequestException('No academic year found.');
		const course = await this.coursePort.findById(command.courseId);
		if (!course) throw new BadRequestException('No course found.');
		if (course.academicYearId !== command.academicYearId)
			throw new BadRequestException(
				'No match between course and academic year id found.',
			);
		const records = await this.attendanceRepo.findByStudentAndDateRange(
			command.studentId,
			year.startDate,
			year.endDate,
		);
		const percent = await this.attendanceService.calculateAbscensePercent(
			records,
			year,
			year.startDate,
			year.endDate,
		);
		if (percent === 0) return;
		const alerts = await this.alertRepo.findByStudentId(command.studentId);
		const newAlert = ThresholdCheckerService.check(percent, alerts);
		if (!newAlert) return;
		await this.alertRepo.save(
			AttendanceAlert.create({
				academicYearId: command.academicYearId,
				tenantId: command.tenantId,
				alertType: newAlert,
				absencePercent: percent,
				courseId: command.courseId,
				studentId: command.studentId,
			}),
		);
		this.em.emit('alert.trigered', newAlert);
	}
}
