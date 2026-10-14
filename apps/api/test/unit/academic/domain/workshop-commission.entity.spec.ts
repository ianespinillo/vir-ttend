import { LEVEL, SHIFT } from '@repo/common';
import { Course } from '../../../../src/modules/academic/domain/entities/course.entity';
import { WorkshopCommission } from '../../../../src/modules/academic/domain/entities/workshop-commission.entity';
import { WorkshopCommissionMapper } from '../../../../src/modules/academic/infrastructure/persistence/mappers/workshop-commission.mapper';

describe('WorkshopCommission', () => {
	const course = Course.create({
		tenantId: 'tenant-1',
		academicYearId: 'ay-1',
		preceptorId: 'preceptor-1',
		level: LEVEL.SECONDARY,
		yearNumber: 1,
		division: '4',
		shift: SHIFT.MORNING,
	});

	it('builds the code as yearNumber + division + commission number', () => {
		const first = WorkshopCommission.create({
			tenantId: 'tenant-1',
			courseId: course.id.getRaw(),
			number: 1,
		});
		const second = WorkshopCommission.create({
			tenantId: 'tenant-1',
			courseId: course.id.getRaw(),
			number: 2,
		});

		expect(first.code(course)).toBe('141');
		expect(second.code(course)).toBe('142');
		expect(
			WorkshopCommission.buildCode({ yearNumber: 3, division: 'B' }, 2),
		).toBe('3B2');
	});

	it('starts without a preceptor and allows assigning one', () => {
		const commission = WorkshopCommission.create({
			tenantId: 'tenant-1',
			courseId: 'course-1',
			number: 1,
		});
		expect(commission.preceptorId).toBeNull();

		commission.assignPreceptor('preceptor-2');
		expect(commission.preceptorId).toBe('preceptor-2');
	});

	it('rejects a commission number other than 1 or 2', () => {
		expect(() =>
			WorkshopCommission.create({
				tenantId: 'tenant-1',
				courseId: 'course-1',
				number: 3 as unknown as 1,
			}),
		).toThrow('Commission number must be 1 or 2');
	});

	it('round-trips through the ORM mapper', () => {
		const domain = WorkshopCommission.create({
			tenantId: 'tenant-1',
			courseId: 'course-1',
			number: 2,
			preceptorId: 'preceptor-1',
		});

		const restored = WorkshopCommissionMapper.toDomain(
			WorkshopCommissionMapper.toOrm(domain),
		);

		expect(restored.id).toBe(domain.id);
		expect(restored.courseId).toBe('course-1');
		expect(restored.number).toBe(2);
		expect(restored.preceptorId).toBe('preceptor-1');
	});
});
