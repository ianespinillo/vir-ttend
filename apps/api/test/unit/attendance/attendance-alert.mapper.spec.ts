import { AlertResponseDto } from '../../../src/modules/attendance/application/dtos/alert.response.dto';
import { AttendanceAlert } from '../../../src/modules/attendance/domain/entities/attendance-alert.entity';
import { AlertType } from '../../../src/modules/attendance/domain/value-objects/alert-type.vo';
import { AttendanceAlertOrmEntity } from '../../../src/modules/attendance/infrastructure/persistence/entities/attendance-alert.orm-entity';
import { AttendanceAlertMapper } from '../../../src/modules/attendance/infrastructure/persistence/mappers/attendance-alert.mapper';

describe('AttendanceAlertMapper', () => {
	const domain = AttendanceAlert.create({
		studentId: 'student-1',
		courseId: 'course-1',
		tenantId: 'tenant-1',
		academicYearId: 'year-1',
		alertType: AlertType.warning(),
		absenceCount: 12.25,
		threshold: 10,
	});

	it('stores the weighted count and the threshold, not a percent', () => {
		const orm = AttendanceAlertMapper.toOrm(domain);
		expect(orm.absenceCount).toBe(12.25);
		expect(orm.threshold).toBe(10);
		expect(orm.alertType).toBe('warning');
		expect(orm.absencePercent).toBeNull();
	});

	it('round-trips through the ORM entity', () => {
		const back = AttendanceAlertMapper.toDomain(
			AttendanceAlertMapper.toOrm(domain),
		);
		expect(back.absenceCount).toBe(12.25);
		expect(back.threshold).toBe(10);
		expect(back.alertType.status).toBe('warning');
		expect(back.id).toBe(domain.id);
	});

	it('reads a legacy percent alert after the migration backfill', () => {
		const orm = Object.assign(new AttendanceAlertOrmEntity(), {
			...AttendanceAlertMapper.toOrm(domain),
			alertType: 'critical',
			absenceCount: 20,
			threshold: 20,
			absencePercent: 80,
		});
		const back = AttendanceAlertMapper.toDomain(orm);
		expect(back.alertType.status).toBe('critical');
		expect(back.threshold).toBe(20);
	});

	it('rejects an unknown alert type', () => {
		const orm = Object.assign(AttendanceAlertMapper.toOrm(domain), {
			alertType: 'nope',
		});
		expect(() => AttendanceAlertMapper.toDomain(orm)).toThrow(
			'Unknown alert type',
		);
	});
});

describe('AlertResponseDto', () => {
	it('exposes the count and threshold instead of the percent', () => {
		const dto = new AlertResponseDto(
			AttendanceAlert.create({
				studentId: 'student-1',
				courseId: 'course-1',
				tenantId: 'tenant-1',
				academicYearId: 'year-1',
				alertType: AlertType.warning(),
				absenceCount: 10.5,
				threshold: 10,
			}),
			'Ana',
			'1° A',
		);
		expect(dto).toMatchObject({
			absenceCount: 10.5,
			threshold: 10,
			alertType: 'warning',
		});
		expect(dto).not.toHaveProperty('absencePercent');
	});
});
