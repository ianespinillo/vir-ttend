import { AttendanceAlert } from '../../../src/modules/attendance/domain/entities/attendance-alert.entity';
import { ThresholdCheckerService } from '../../../src/modules/attendance/domain/services/threshold-checker.service';
import { AlertType } from '../../../src/modules/attendance/domain/value-objects/alert-type.vo';

describe('ThresholdCheckerService', () => {
	const makeAlert = (alertType: AlertType, seenAt?: Date): AttendanceAlert =>
		AttendanceAlert.reconstitute({
			id: 'alert-1',
			studentId: 'student-1',
			courseId: 'course-1',
			tenantId: 'tenant-1',
			academicYearId: 'year-1',
			alertType,
			absencePercent: 60,
			seenBy: seenAt ? 'user-1' : undefined,
			seenAt,
			createdAt: new Date(),
		});

	describe('check', () => {
		it('retorna null cuando el porcentaje está por debajo del umbral de warning (< 50)', () => {
			expect(ThresholdCheckerService.check(0, [])).toBeNull();
			expect(ThresholdCheckerService.check(25, [])).toBeNull();
			expect(ThresholdCheckerService.check(49, [])).toBeNull();
		});

		it('retorna warning cuando el porcentaje es >= 50 y < 75', () => {
			const result = ThresholdCheckerService.check(50, []);
			expect(result).not.toBeNull();
			expect(result?.status).toBe('warning');
		});

		it('retorna warning para 60%', () => {
			const result = ThresholdCheckerService.check(60, []);
			expect(result?.status).toBe('warning');
		});

		it('retorna critical cuando el porcentaje es >= 75', () => {
			const result = ThresholdCheckerService.check(75, []);
			expect(result).not.toBeNull();
			expect(result?.status).toBe('critical');
		});

		it('retorna critical para 90%', () => {
			const result = ThresholdCheckerService.check(90, []);
			expect(result?.status).toBe('critical');
		});

		it('retorna exceeded cuando el porcentaje es >= 100', () => {
			const result = ThresholdCheckerService.check(100, []);
			expect(result).not.toBeNull();
			expect(result?.status).toBe('exceeded');
		});

		it('retorna exceeded para porcentajes superiores a 100', () => {
			const result = ThresholdCheckerService.check(150, []);
			expect(result?.status).toBe('exceeded');
		});

		it('retorna null para porcentaje negativo', () => {
			expect(ThresholdCheckerService.check(-10, [])).toBeNull();
		});

		it('retorna exactamente en los límites de cada umbral', () => {
			expect(ThresholdCheckerService.check(49.99, [])).toBeNull();
			expect(ThresholdCheckerService.check(50, [])?.status).toBe('warning');
			expect(ThresholdCheckerService.check(74.99, [])?.status).toBe('warning');
			expect(ThresholdCheckerService.check(75, [])?.status).toBe('critical');
			expect(ThresholdCheckerService.check(99.99, [])?.status).toBe('critical');
			expect(ThresholdCheckerService.check(100, [])?.status).toBe('exceeded');
		});
	});

	describe('deduplicación', () => {
		it('retorna null si ya existe una alerta activa del mismo tipo', () => {
			const existing = makeAlert(AlertType.warning());
			const result = ThresholdCheckerService.check(60, [existing]);
			expect(result).toBeNull();
		});

		it('retorna null si ya existe una alerta activa critical y el porcentaje corresponde a critical', () => {
			const existing = makeAlert(AlertType.critical());
			const result = ThresholdCheckerService.check(80, [existing]);
			expect(result).toBeNull();
		});

		it('retorna null si ya existe una alerta activa exceeded y el porcentaje corresponde a exceeded', () => {
			const existing = makeAlert(AlertType.exceeded());
			const result = ThresholdCheckerService.check(110, [existing]);
			expect(result).toBeNull();
		});

		it('permite crear alerta si la existente fue vista (seenAt definido)', () => {
			const seen = makeAlert(AlertType.warning(), new Date());
			const result = ThresholdCheckerService.check(60, [seen]);
			expect(result).not.toBeNull();
			expect(result?.status).toBe('warning');
		});

		it('permite escalar de warning a critical aunque exista una warning activa', () => {
			const existingWarning = makeAlert(AlertType.warning());
			const result = ThresholdCheckerService.check(80, [existingWarning]);
			expect(result).not.toBeNull();
			expect(result?.status).toBe('critical');
		});

		it('permite escalar de critical a exceeded aunque exista una critical activa', () => {
			const existingCritical = makeAlert(AlertType.critical());
			const result = ThresholdCheckerService.check(105, [existingCritical]);
			expect(result).not.toBeNull();
			expect(result?.status).toBe('exceeded');
		});

		it('retorna null si existe warning activa y el porcentaje sigue en rango warning', () => {
			const existing = makeAlert(AlertType.warning());
			expect(ThresholdCheckerService.check(55, [existing])).toBeNull();
		});

		it('funciona con múltiples alertas existentes de distintos tipos', () => {
			const warning = makeAlert(AlertType.warning());
			const critical = makeAlert(AlertType.critical());
			// exceeded sigue disponible porque no hay exceeded activa
			const result = ThresholdCheckerService.check(100, [warning, critical]);
			expect(result).not.toBeNull();
			expect(result?.status).toBe('exceeded');
		});

		it('retorna null si hay alertas de todos los tipos activos y el porcentaje es exceeded', () => {
			const warning = makeAlert(AlertType.warning());
			const critical = makeAlert(AlertType.critical());
			const exceeded = makeAlert(AlertType.exceeded());
			expect(
				ThresholdCheckerService.check(100, [warning, critical, exceeded]),
			).toBeNull();
		});
	});
});
