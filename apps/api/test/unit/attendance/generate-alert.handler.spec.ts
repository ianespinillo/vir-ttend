import { EventEmitter2 } from '@nestjs/event-emitter';
import { LEVEL } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { GenerateAlertCommand } from '../../../src/modules/attendance/application/commands/generate-alert/generate-alert.command';
import { GenerateAlertHandler } from '../../../src/modules/attendance/application/commands/generate-alert/generate-alert.handler';
import { AcademicYear } from '../../../src/modules/attendance/domain/entities/academic-year.entity';
import { AttendanceAlert } from '../../../src/modules/attendance/domain/entities/attendance-alert.entity';
import { Course } from '../../../src/modules/attendance/domain/entities/course.entity';
import { IAcademicYearPort } from '../../../src/modules/attendance/domain/ports/academic-year.port.interface';
import { ICoursePort } from '../../../src/modules/attendance/domain/ports/courses.port.interface';
import { IAttendanceAlertRepository } from '../../../src/modules/attendance/domain/repositories/attendance-alert.repository.interface';
import { IAttendanceRecordRepository } from '../../../src/modules/attendance/domain/repositories/attendance-record.repository.interface';
import { AttendanceCalculationService } from '../../../src/modules/attendance/domain/services/attendance-calculation.service';
import { AlertType } from '../../../src/modules/attendance/domain/value-objects/alert-type.vo';

describe('GenerateAlertHandler', () => {
	let handler: GenerateAlertHandler;
	let academicPort: MockProxy<IAcademicYearPort>;
	let coursePort: MockProxy<ICoursePort>;
	let attendanceService: MockProxy<AttendanceCalculationService>;
	let attendanceRepo: MockProxy<IAttendanceRecordRepository>;
	let alertRepo: MockProxy<IAttendanceAlertRepository>;
	let eventEmitter: MockProxy<EventEmitter2>;

	const year = AcademicYear.reconstitute(
		'year-1',
		85,
		30,
		new Date('2026-03-01'),
		new Date('2026-12-31'),
	);
	const course = Course.reconstitute(
		'course-1',
		'3ro A',
		'year-1',
		true,
		LEVEL.PRIMARY,
	);

	beforeEach(() => {
		academicPort = mock<IAcademicYearPort>();
		coursePort = mock<ICoursePort>();
		attendanceService = mock<AttendanceCalculationService>();
		attendanceRepo = mock<IAttendanceRecordRepository>();
		alertRepo = mock<IAttendanceAlertRepository>();
		eventEmitter = mock<EventEmitter2>();

		academicPort.findById.mockResolvedValue(year);
		coursePort.findById.mockResolvedValue(course);
		attendanceRepo.findByStudentAndDateRange.mockResolvedValue([]);
		attendanceService.calculateAbscensePercent.mockResolvedValue(0);
		alertRepo.findByStudentId.mockResolvedValue([]);

		handler = new GenerateAlertHandler(
			academicPort,
			coursePort,
			attendanceService,
			attendanceRepo,
			alertRepo,
			eventEmitter,
		);
	});

	const cmd = new GenerateAlertCommand(
		'student-1',
		'course-1',
		'year-1',
		'tenant-1',
	);

	it('lanza BadRequestException si no encuentra el academic year', async () => {
		academicPort.findById.mockResolvedValue(null);
		await expect(handler.execute(cmd)).rejects.toThrow('No academic year found.');
	});

	it('lanza BadRequestException si no encuentra el curso', async () => {
		coursePort.findById.mockResolvedValue(null);
		await expect(handler.execute(cmd)).rejects.toThrow('No course found.');
	});

	it('lanza BadRequestException si el curso no pertenece al academic year', async () => {
		const wrongCourse = Course.reconstitute(
			'course-1',
			'3ro A',
			'year-OTHER',
			true,
			LEVEL.PRIMARY,
		);
		coursePort.findById.mockResolvedValue(wrongCourse);
		await expect(handler.execute(cmd)).rejects.toThrow(
			'No match between course and academic year id found.',
		);
	});

	it('no crea alerta si el porcentaje de ausencia es 0', async () => {
		await handler.execute(cmd);
		expect(alertRepo.save).not.toHaveBeenCalled();
		expect(eventEmitter.emit).not.toHaveBeenCalled();
	});

	it('no crea alerta si ThresholdChecker retorna null (porcentaje bajo)', async () => {
		attendanceService.calculateAbscensePercent.mockResolvedValue(30);
		await handler.execute(cmd);
		expect(alertRepo.save).not.toHaveBeenCalled();
	});

	it('crea alerta y emite evento cuando el porcentaje supera un umbral', async () => {
		attendanceService.calculateAbscensePercent.mockResolvedValue(60);
		await handler.execute(cmd);
		expect(alertRepo.save).toHaveBeenCalledTimes(1);
		expect(eventEmitter.emit).toHaveBeenCalledWith(
			'alert.trigered',
			expect.objectContaining({ status: 'warning' }),
		);
	});

	it('no crea alerta duplicada si ya existe una activa del mismo tipo', async () => {
		attendanceService.calculateAbscensePercent.mockResolvedValue(60);
		const existingAlert = mock<AttendanceAlert>({
			alertType: {
				equals: (other: AlertType) => other.status === 'warning',
			},
			seenAt: undefined,
		});
		alertRepo.findByStudentId.mockResolvedValue([existingAlert]);
		await handler.execute(cmd);
		expect(alertRepo.save).not.toHaveBeenCalled();
	});

	it('crea alerta si la existente fue vista', async () => {
		attendanceService.calculateAbscensePercent.mockResolvedValue(60);
		const seenAlert = mock<AttendanceAlert>({
			alertType: {
				equals: (other: AlertType) => other.status === 'warning',
			},
			seenAt: new Date(),
		});
		alertRepo.findByStudentId.mockResolvedValue([seenAlert]);
		await handler.execute(cmd);
		expect(alertRepo.save).toHaveBeenCalledTimes(1);
	});

	it('escala a critical cuando el porcentaje es >= 75', async () => {
		attendanceService.calculateAbscensePercent.mockResolvedValue(80);
		await handler.execute(cmd);
		expect(alertRepo.save).toHaveBeenCalledTimes(1);
		expect(eventEmitter.emit).toHaveBeenCalledWith(
			'alert.trigered',
			expect.objectContaining({ status: 'critical' }),
		);
	});

	it('escala a exceeded cuando el porcentaje es >= 100', async () => {
		attendanceService.calculateAbscensePercent.mockResolvedValue(105);
		await handler.execute(cmd);
		expect(alertRepo.save).toHaveBeenCalledTimes(1);
		expect(eventEmitter.emit).toHaveBeenCalledWith(
			'alert.trigered',
			expect.objectContaining({ status: 'exceeded' }),
		);
	});

	it('permite escalar de warning a critical aunque exista una warning activa', async () => {
		attendanceService.calculateAbscensePercent.mockResolvedValue(80);
		const existingWarning = mock<AttendanceAlert>({
			alertType: {
				equals: (other: AlertType) => other.status === 'warning',
			},
			seenAt: undefined,
		});
		alertRepo.findByStudentId.mockResolvedValue([existingWarning]);
		await handler.execute(cmd);
		expect(alertRepo.save).toHaveBeenCalledTimes(1);
		expect(eventEmitter.emit).toHaveBeenCalledWith(
			'alert.trigered',
			expect.objectContaining({ status: 'critical' }),
		);
	});
});
