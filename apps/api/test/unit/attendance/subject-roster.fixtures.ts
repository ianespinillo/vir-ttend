import { CommissionNumber } from '@repo/common';
import { WorkshopCommissionInfo } from '../../../src/modules/attendance/domain/ports/workshop-commission.port.interface';

/** Commission `n` of `course-1`, with id `commission-<n>`. */
export const buildCommissionInfo = (
	number: CommissionNumber,
	courseId = 'course-1',
): WorkshopCommissionInfo => ({
	id: `commission-${number}`,
	tenantId: 'tenant-1',
	courseId,
	courseName: '1° 4°',
	number,
	code: `14${number}`,
	preceptorId: null,
});
