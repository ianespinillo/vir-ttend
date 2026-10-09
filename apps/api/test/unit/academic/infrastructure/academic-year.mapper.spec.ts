import { AcademicYear } from '../../../../src/modules/academic/domain/entities/academic-year.entity';
import { AcademicYearOrmEntity } from '../../../../src/modules/academic/infrastructure/persistence/entities/academic-year.orm-entity';
import { AcademicYearMapper } from '../../../../src/modules/academic/infrastructure/persistence/mappers/academic-year.mapper';

describe('AcademicYearMapper', () => {
	const now = new Date();
	const startDate = new Date('2026-03-01');
	const endDate = new Date('2026-12-18');
	const nonWorkingDays = [new Date('2026-05-25'), new Date('2026-07-09')];

	it('maps all domain entity properties to ORM entity, including dates and nonWorkingDays', () => {
		const domain = AcademicYear.reconstitute({
			id: 'ay-uuid-1',
			tenantId: 'tenant-uuid-1',
			year: 2026,
			startDate,
			endDate,
			nonWorkingDays,
			absenceThresholdPercent: 20,
			lateCountAbscenseAfterMinutes: 10,
			isActive: true,
			createdAt: now,
			updatedAt: now,
		});

		const orm = AcademicYearMapper.toOrm(domain);

		expect(orm.id).toBe('ay-uuid-1');
		expect(orm.schoolId).toBe('tenant-uuid-1');
		expect(orm.year).toBe(2026);
		expect(orm.startDate).toEqual(startDate);
		expect(orm.endDate).toEqual(endDate);
		expect(orm.nonWorkingDays).toEqual(nonWorkingDays);
		expect(orm.absenceThresholdPercent).toBe(20);
		expect(orm.lateCountAbscenseAfterMinutes).toBe(10);
		expect(orm.isActive).toBe(true);
	});

	it('maps ORM entity back to domain entity correctly', () => {
		const orm = new AcademicYearOrmEntity();
		orm.id = 'ay-uuid-2';
		orm.schoolId = 'tenant-uuid-2';
		orm.year = 2026;
		orm.startDate = startDate;
		orm.endDate = endDate;
		orm.nonWorkingDays = nonWorkingDays;
		orm.absenceThresholdPercent = 15;
		orm.lateCountAbscenseAfterMinutes = 15;
		orm.isActive = true;
		orm.createdAt = now;
		orm.updatedAt = now;

		const domain = AcademicYearMapper.toDomain(orm);

		expect(domain.id.getRaw()).toBe('ay-uuid-2');
		expect(domain.tenantId).toBe('tenant-uuid-2');
		expect(domain.year).toBe(2026);
		expect(domain.startDate).toEqual(startDate);
		expect(domain.endDate).toEqual(endDate);
		expect(domain.nonWorkingDays).toEqual(nonWorkingDays);
		expect(domain.absenceThresholdPercent).toBe(15);
		expect(domain.lateCountAbscenseAfterMinutes).toBe(15);
		expect(domain.isActive).toBe(true);
	});
});
