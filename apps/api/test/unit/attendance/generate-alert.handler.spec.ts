import { EventEmitter2 } from '@nestjs/event-emitter';
import { LEVEL } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { GenerateAlertCommand } from '../../../src/modules/attendance/application/commands/generate-alert/generate-alert.command';
import { GenerateAlertHandler } from '../../../src/modules/attendance/application/commands/generate-alert/generate-alert.handler';
import { StudentWeightedAbsencesService } from '../../../src/modules/attendance/application/services/student-weighted-absences.service';
import { AcademicYear } from '../../../src/modules/attendance/domain/entities/academic-year.entity';
import { AttendanceAlert } from '../../../src/modules/attendance/domain/entities/attendance-alert.entity';
import { Course } from '../../../src/modules/attendance/domain/entities/course.entity';
import { IAcademicYearPort } from '../../../src/modules/attendance/domain/ports/academic-year.port.interface';
import { ICoursePort } from '../../../src/modules/attendance/domain/ports/courses.port.interface';
import { IAttendanceAlertRepository } from '../../../src/modules/attendance/domain/repositories/attendance-alert.repository.interface';
import { AlertType } from '../../../src/modules/attendance/domain/value-objects/alert-type.vo';

describe('GenerateAlertHandler', () => {
	let handler: GenerateAlertHandler;
	let academicPort: MockProxy<IAcademicYearPort>;
	let coursePort: MockProxy<ICoursePort>;
	let weightedAbsences: MockProxy<StudentWeightedAbsencesService>;
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
	const cmd = new GenerateAlertCommand(
		'student-1',
		'course-1',
		'year-1',
		'tenant-1',
	);

	const withTotal = (total: number, cap = 28) =>
		weightedAbsences.getStudentWeightedAbsences.mockResolvedValue({
			total,
			cap,
			breakdown: { daily: total, workshop: 0 },
		});

	const existingAlert = (
		alertType: AlertType,
		academicYearId = 'year-1',
		seenAt?: Date,
	) =>
		AttendanceAlert.reconstitute({
			id: 'alert-old',
			studentId: 'student-1',
			courseId: 'course-1',
			tenantId: 'tenant-1',
			academicYearId,
			alertType,
			absenceCount: 10,
			threshold: 10,
			seenAt,
			seenBy: seenAt ? 'user-1' : undefined,
			createdAt: new Date(),
		});

	const savedAlert = (): AttendanceAlert => alertRepo.save.mock.calls[0][0];

	beforeEach(() => {
		academicPort = mock<IAcademicYearPort>();
		coursePort = mock<ICoursePort>();
		weightedAbsences = mock<StudentWeightedAbsencesService>();
		alertRepo = mock<IAttendanceAlertRepository>();
		eventEmitter = mock<EventEmitter2>();

		academicPort.findById.mockResolvedValue(year);
		coursePort.findById.mockResolvedValue(course);
		alertRepo.findByStudentId.mockResolvedValue([]);
		withTotal(0);

		handler = new GenerateAlertHandler(
			academicPort,
			coursePort,
			weightedAbsences,
			alertRepo,
			eventEmitter,
		);
	});

	it('throws when the academic year does not exist', async () => {
		academicPort.findById.mockResolvedValue(null);
		await expect(handler.execute(cmd)).rejects.toThrow('No academic year found.');
	});

	it('throws when the course does not exist', async () => {
		coursePort.findById.mockResolvedValue(null);
		await expect(handler.execute(cmd)).rejects.toThrow('No course found.');
	});

	it('throws when the course belongs to another academic year', async () => {
		coursePort.findById.mockResolvedValue(
			Course.reconstitute('course-1', '3ro A', 'year-OTHER', true, LEVEL.PRIMARY),
		);
		await expect(handler.execute(cmd)).rejects.toThrow(
			'No match between course and academic year id found.',
		);
	});

	it('counts the weighted absences of the student in the academic year', async () => {
		await handler.execute(cmd);
		expect(weightedAbsences.getStudentWeightedAbsences).toHaveBeenCalledWith(
			'student-1',
			'year-1',
		);
	});

	it.each([0, 4.5, 9.75])(
		'creates no alert below 10 absences (%p)',
		async (total) => {
			withTotal(total);
			await handler.execute(cmd);
			expect(alertRepo.save).not.toHaveBeenCalled();
			expect(eventEmitter.emit).not.toHaveBeenCalled();
		},
	);

	it.each([
		[10, 10, 'warning'],
		[12.5, 10, 'warning'],
		[20, 20, 'critical'],
		[27.75, 20, 'critical'],
		[28, 28, 'exceeded'],
		[31, 28, 'exceeded'],
	])(
		'with %p absences raises the %p threshold (%s)',
		async (total, threshold, status) => {
			withTotal(total);
			await handler.execute(cmd);
			expect(alertRepo.save).toHaveBeenCalledTimes(1);
			const alert = savedAlert();
			expect(alert.absenceCount).toBe(total);
			expect(alert.threshold).toBe(threshold);
			expect(alert.alertType.status).toBe(status);
			expect(alert).toMatchObject({
				studentId: 'student-1',
				courseId: 'course-1',
				academicYearId: 'year-1',
				tenantId: 'tenant-1',
			});
		},
	);

	it('takes the last threshold from the cap of the student', async () => {
		withTotal(28, 30);
		await handler.execute(cmd);
		expect(savedAlert().threshold).toBe(20);

		alertRepo.save.mockClear();
		withTotal(30, 30);
		await handler.execute(cmd);
		expect(savedAlert().threshold).toBe(30);
		expect(savedAlert().alertType.status).toBe('exceeded');
	});

	it('raises a single alert for the highest threshold crossed at once', async () => {
		withTotal(21);
		await handler.execute(cmd);
		expect(alertRepo.save).toHaveBeenCalledTimes(1);
		expect(savedAlert().threshold).toBe(20);
	});

	it('creates no duplicate when the threshold was already alerted', async () => {
		withTotal(12);
		alertRepo.findByStudentId.mockResolvedValue([
			existingAlert(AlertType.warning()),
		]);
		await handler.execute(cmd);
		expect(alertRepo.save).not.toHaveBeenCalled();
		expect(eventEmitter.emit).not.toHaveBeenCalled();
	});

	it('creates no duplicate when the existing alert was already seen', async () => {
		withTotal(12);
		alertRepo.findByStudentId.mockResolvedValue([
			existingAlert(AlertType.warning(), 'year-1', new Date()),
		]);
		await handler.execute(cmd);
		expect(alertRepo.save).not.toHaveBeenCalled();
	});

	it('escalates from warning to critical', async () => {
		withTotal(20.25);
		alertRepo.findByStudentId.mockResolvedValue([
			existingAlert(AlertType.warning()),
		]);
		await handler.execute(cmd);
		expect(savedAlert().alertType.status).toBe('critical');
	});

	it('does not raise a lower threshold once a higher one was alerted', async () => {
		withTotal(25);
		alertRepo.findByStudentId.mockResolvedValue([
			existingAlert(AlertType.critical()),
		]);
		await handler.execute(cmd);
		expect(alertRepo.save).not.toHaveBeenCalled();
	});

	it('ignores alerts of a previous academic year', async () => {
		withTotal(12);
		alertRepo.findByStudentId.mockResolvedValue([
			existingAlert(AlertType.warning(), 'year-previous'),
		]);
		await handler.execute(cmd);
		expect(alertRepo.save).toHaveBeenCalledTimes(1);
	});

	it('emits alert.triggered with the saved alert', async () => {
		withTotal(10);
		await handler.execute(cmd);
		expect(eventEmitter.emit).toHaveBeenCalledTimes(1);
		expect(eventEmitter.emit).toHaveBeenCalledWith(
			'alert.triggered',
			savedAlert(),
		);
	});

	it('saves the alert before announcing it', async () => {
		withTotal(10);
		await handler.execute(cmd);
		expect(alertRepo.save.mock.invocationCallOrder[0]).toBeLessThan(
			eventEmitter.emit.mock.invocationCallOrder[0],
		);
	});
});
