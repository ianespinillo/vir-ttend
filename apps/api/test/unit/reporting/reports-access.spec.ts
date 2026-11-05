import { ROLES } from '@repo/common';
import { JwtAuthGuard } from '../../../src/common/guard/jwt-auth.guard';
import { RolesGuard } from '../../../src/common/guard/roles.guard';
import { ReportsController } from '../../../src/modules/reporting/presentation/controllers/reports.controller';
import { StudentReportsController } from '../../../src/modules/reporting/presentation/controllers/student-reports.controller';

describe.each([
	['ReportsController', ReportsController],
	['StudentReportsController', StudentReportsController],
])('%s access', (_name, controller) => {
	it('requires a session and a role check', () => {
		expect(Reflect.getMetadata('__guards__', controller)).toEqual([
			JwtAuthGuard,
			RolesGuard,
		]);
	});

	it('allows only preceptors and admins, like the report exports', () => {
		expect(Reflect.getMetadata('roles', controller)).toEqual([
			ROLES.PRECEPTOR,
			ROLES.ADMIN,
		]);
	});
});
