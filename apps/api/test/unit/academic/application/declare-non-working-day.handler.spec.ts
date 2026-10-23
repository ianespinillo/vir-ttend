import { EventEmitter2 } from '@nestjs/event-emitter';
import { SHIFT } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { NotFoundError } from '../../../../src/common/errors';
import { DeclareNonWorkingDayCommand } from '../../../../src/modules/academic/application/commands/declare-non-working-day/declare-non-working-day.command';
import { DeclareNonWorkingDayHandler } from '../../../../src/modules/academic/application/commands/declare-non-working-day/declare-non-working-day.handler';
import { AcademicYear } from '../../../../src/modules/academic/domain/entities/academic-year.entity';
import { IAcademicYearRepository } from '../../../../src/modules/academic/domain/repositories/academic-year.repository.interface';
import { NonWorkingDayDeclaredEvent } from '../../../../src/modules/academic/events/non-working-day-declared.event';

describe('DeclareNonWorkingDayHandler', () => {
	let handler: DeclareNonWorkingDayHandler;
	let academicYearRepository: MockProxy<IAcademicYearRepository>;
	let eventEmitter: MockProxy<EventEmitter2>;

	const tenantId = 'tenant-123';
	const academicYearId = 'year-456';
	const authorId = 'user-789';

	const createAcademicYear = (nonWorkingDays: Date[] = []) =>
		AcademicYear.reconstitute({
			id: academicYearId,
			tenantId,
			year: 2026,
			startDate: new Date('2026-03-01T00:00:00.000Z'),
			endDate: new Date('2026-12-20T00:00:00.000Z'),
			isActive: true,
			nonWorkingDays,
			absenceThresholdPercent: 20,
			lateCountAbscenseAfterMinutes: 15,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

	beforeEach(() => {
		academicYearRepository = mock<IAcademicYearRepository>();
		eventEmitter = mock<EventEmitter2>();
		handler = new DeclareNonWorkingDayHandler(
			academicYearRepository,
			eventEmitter,
		);
	});

	it('should throw NotFoundError if academic year does not exist', async () => {
		academicYearRepository.findById.mockResolvedValue(null);

		const command = new DeclareNonWorkingDayCommand(
			academicYearId,
			new Date('2026-05-15T00:00:00.000Z'),
			'Paro docente',
			'strike',
			true,
			tenantId,
			authorId,
		);

		await expect(handler.execute(command)).rejects.toThrow(NotFoundError);
		expect(academicYearRepository.save).not.toHaveBeenCalled();
		expect(eventEmitter.emit).not.toHaveBeenCalled();
	});

	it('should throw NotFoundError if academic year belongs to another tenant', async () => {
		const yearOtherTenant = AcademicYear.reconstitute({
			id: academicYearId,
			tenantId: 'other-tenant',
			year: 2026,
			startDate: new Date('2026-03-01T00:00:00.000Z'),
			endDate: new Date('2026-12-20T00:00:00.000Z'),
			isActive: true,
			nonWorkingDays: [],
			absenceThresholdPercent: 20,
			lateCountAbscenseAfterMinutes: 15,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		academicYearRepository.findById.mockResolvedValue(yearOtherTenant);

		const command = new DeclareNonWorkingDayCommand(
			academicYearId,
			new Date('2026-05-15T00:00:00.000Z'),
			'Paro docente',
			'strike',
			true,
			tenantId,
			authorId,
		);

		await expect(handler.execute(command)).rejects.toThrow(NotFoundError);
	});

	it('should add non-working day, save, and emit event when notifySchool is true', async () => {
		const existingYear = createAcademicYear([]);
		academicYearRepository.findById.mockResolvedValue(existingYear);

		const targetDate = new Date('2026-05-15T00:00:00.000Z');
		const command = new DeclareNonWorkingDayCommand(
			academicYearId,
			targetDate,
			'Paro docente nacional',
			'strike',
			true,
			tenantId,
			authorId,
		);

		const result = await handler.execute(command);

		expect(academicYearRepository.save).toHaveBeenCalledTimes(1);
		expect(result.nonWorkingDays).toHaveLength(1);
		expect(result.nonWorkingDays[0].getTime()).toBe(targetDate.getTime());

		expect(eventEmitter.emit).toHaveBeenCalledWith(
			'non-working-day.declared',
			expect.any(NonWorkingDayDeclaredEvent),
		);
		const emittedEvent = eventEmitter.emit.mock
			.calls[0][1] as NonWorkingDayDeclaredEvent;
		expect(emittedEvent.academicYearId).toBe(academicYearId);
		expect(emittedEvent.tenantId).toBe(tenantId);
		expect(emittedEvent.date.getTime()).toBe(targetDate.getTime());
		expect(emittedEvent.reason).toBe('Paro docente nacional');
		expect(emittedEvent.authorId).toBe(authorId);
	});

	it('should store the shift scope and forward it in the event', async () => {
		const existingYear = createAcademicYear([]);
		academicYearRepository.findById.mockResolvedValue(existingYear);

		const result = await handler.execute(
			new DeclareNonWorkingDayCommand(
				academicYearId,
				new Date('2026-05-15T00:00:00.000Z'),
				'Paro docente turno mañana',
				'strike',
				true,
				tenantId,
				authorId,
				[SHIFT.MORNING],
			),
		);

		expect(result.nonWorkingDayShifts).toEqual({ '2026-05-15': [SHIFT.MORNING] });
		const emittedEvent = eventEmitter.emit.mock
			.calls[0][1] as NonWorkingDayDeclaredEvent;
		expect(emittedEvent.shifts).toEqual([SHIFT.MORNING]);
	});

	it('should declare the whole day when no shifts are given', async () => {
		const existingYear = createAcademicYear([]);
		academicYearRepository.findById.mockResolvedValue(existingYear);

		const result = await handler.execute(
			new DeclareNonWorkingDayCommand(
				academicYearId,
				new Date('2026-05-15T00:00:00.000Z'),
				'Feriado',
				'holiday',
				true,
				tenantId,
				authorId,
			),
		);

		expect(result.nonWorkingDayShifts).toEqual({});
		const emittedEvent = eventEmitter.emit.mock
			.calls[0][1] as NonWorkingDayDeclaredEvent;
		expect(emittedEvent.shifts).toEqual([]);
	});

	it('should not emit event when notifySchool is false', async () => {
		const existingYear = createAcademicYear([]);
		academicYearRepository.findById.mockResolvedValue(existingYear);

		const targetDate = new Date('2026-05-15T00:00:00.000Z');
		const command = new DeclareNonWorkingDayCommand(
			academicYearId,
			targetDate,
			'Feriado interno sin comunicado',
			'holiday',
			false,
			tenantId,
			authorId,
		);

		const result = await handler.execute(command);

		expect(academicYearRepository.save).toHaveBeenCalledTimes(1);
		expect(result.nonWorkingDays).toHaveLength(1);
		expect(eventEmitter.emit).not.toHaveBeenCalled();
	});
});
