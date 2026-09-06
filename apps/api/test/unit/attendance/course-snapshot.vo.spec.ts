import { COURSE_RISK_STATUS } from '@repo/common';
import { CourseSnapshot } from '../../../src/modules/attendance/domain/value-objects/course-snapshot.vo';

describe('CourseSnapshot', () => {
	it('calcula absencePercent sobre el universo de clases esperadas por alumno', () => {
		// 10 clases esperadas x 20 alumnos = 200 registros posibles
		const snapshot = new CourseSnapshot(
			'course-1',
			10,
			'3° A',
			20,
			150,
			30,
			10,
			10,
		);

		expect(snapshot.absencePercent).toBe(20);
	});

	it('calcula presentsPercent sobre el universo de clases esperadas por alumno', () => {
		const snapshot = new CourseSnapshot(
			'course-1',
			10,
			'3° A',
			20,
			150,
			30,
			10,
			10,
		);

		expect(snapshot.presentsPercent).toBe(80);
	});

	it('retorna 0 en los porcentajes si no hay clases esperadas (evita division por cero)', () => {
		const snapshot = new CourseSnapshot('course-1', 0, '3° A', 25, 5, 2, 1, 0);

		expect(snapshot.absencePercent).toBe(0);
		expect(snapshot.presentsPercent).toBe(0);
	});

	it('retorna 0 en los porcentajes si el curso no tiene alumnos', () => {
		const snapshot = new CourseSnapshot('course-1', 10, '3° A', 0, 0, 0, 0, 0);

		expect(snapshot.absencePercent).toBe(0);
		expect(snapshot.presentsPercent).toBe(0);
	});

	it('calcula presentsPercent aun cuando no hay presentes pero si tardanzas', () => {
		const snapshot = new CourseSnapshot('course-1', 5, '3° A', 10, 0, 8, 2, 0);

		expect(snapshot.presentsPercent).toBe(4);
		expect(snapshot.absencePercent).toBe(20);
	});

	it('marca riesgo critico cuando absencePercent supera el umbral', () => {
		// 4 clases x 5 alumnos = 20 slots; 18 ausentes = 90%
		const snapshot = new CourseSnapshot('course-1', 4, '3° A', 5, 0, 18, 0, 2);

		expect(snapshot.getRiskStatus(75, 85)).toBe(COURSE_RISK_STATUS.CRITICAL);
	});
});
