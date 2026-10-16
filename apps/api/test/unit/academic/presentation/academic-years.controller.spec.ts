import { JwtPayload, ROLES } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { CreateAcademicYearHandler } from '../../../../src/modules/academic/application/commands/create-academic-year/create-academic-year.handler';
import { DeclareNonWorkingDayCommand } from '../../../../src/modules/academic/application/commands/declare-non-working-day/declare-non-working-day.command';
import { DeclareNonWorkingDayHandler } from '../../../../src/modules/academic/application/commands/declare-non-working-day/declare-non-working-day.handler';
import { UpdateAcademicYearHandler } from '../../../../src/modules/academic/application/commands/update-academic-year/update-academic-year.handler';
import { AcademicYearResponseDto } from '../../../../src/modules/academic/application/dtos/academic-year.response.dto';
import { DeclareNonWorkingDayRequestDto } from '../../../../src/modules/academic/application/dtos/declare-non-working-day.request.dto';
import { GetAcademicYearsHandler } from '../../../../src/modules/academic/application/queries/get-academic-years/get-academic-years.handler';
import { GetActiveAcademicYearHandler } from '../../../../src/modules/academic/application/queries/get-active-academic-year/get-active-academic-year.handler';
import { AcademicYear } from '../../../../src/modules/academic/domain/entities/academic-year.entity';
import { AcademicYearsController } from '../../../../src/modules/academic/presentation/controllers/academic-year.controller';

describe('AcademicYearsController.declareNonWorkingDay', () => {
	let controller: AcademicYearsController;
	let declareHandler: MockProxy<DeclareNonWorkingDayHandler>;

	const adminUser: JwtPayload = {
		sub: 'admin-uuid-1',
		tenantId: 'tenant-1',
		role: ROLES.ADMIN,
		email: 'admin@example.com',
	};

	beforeEach(() => {
		declareHandler = mock<DeclareNonWorkingDayHandler>();
		controller = new AcademicYearsController(
			mock<CreateAcademicYearHandler>(),
			mock<UpdateAcademicYearHandler>(),
			declareHandler,
			mock<GetAcademicYearsHandler>(),
			mock<GetActiveAcademicYearHandler>(),
		);
	});

	it('delegates to DeclareNonWorkingDayHandler with tenant and author from token', async () => {
		const targetDate = new Date('2026-06-15T00:00:00.000Z');
		const dto: DeclareNonWorkingDayRequestDto = {
			date: targetDate,
			reason: 'Movilización docente',
			type: 'mobilization',
			notifySchool: true,
		};

		const fakePeriod = AcademicYear.reconstitute({
			id: 'year-1',
			tenantId: 'tenant-1',
			year: 2026,
			startDate: new Date('2026-03-01'),
			endDate: new Date('2026-12-20'),
			isActive: true,
			nonWorkingDays: [targetDate],
			absenceThresholdPercent: 20,
			lateCountAbscenseAfterMinutes: 15,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		declareHandler.execute.mockResolvedValue(
			new AcademicYearResponseDto(fakePeriod),
		);

		const result = await controller.declareNonWorkingDay(
			'year-1',
			dto,
			adminUser,
		);

		expect(declareHandler.execute).toHaveBeenCalledTimes(1);
		const command: DeclareNonWorkingDayCommand =
			declareHandler.execute.mock.calls[0][0];
		expect(command.academicYearId).toBe('year-1');
		expect(command.date).toBe(targetDate);
		expect(command.reason).toBe('Movilización docente');
		expect(command.type).toBe('mobilization');
		expect(command.notifySchool).toBe(true);
		expect(command.tenantId).toBe('tenant-1');
		expect(command.authorId).toBe('admin-uuid-1');
		expect(result.id).toBe('year-1');
	});
});
