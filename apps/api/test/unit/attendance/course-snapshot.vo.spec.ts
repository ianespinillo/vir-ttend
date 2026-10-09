import { COURSE_RISK_STATUS } from '@repo/common';
import { CourseSnapshot } from '../../../src/modules/attendance/domain/value-objects/course-snapshot.vo';

describe('CourseSnapshot', () => {
	it('calcula absencePercent sobre los registros cargados (ignora clases sin asistencia tomada)', () => {
		// 10 clases programadas x 20 alumnos = 200 slots, pero solo 5 clases
		// tuvieron asistencia tomada: 100 registros (92 presentes, 6 ausentes, 2 tarde).
		const snapshot = new CourseSnapshot('course-1', 10, '3° A', 20, 92, 6, 2, 0);

		// 8 de 100 registros con ausencia/tarde -> 8%, NO 4% (8/200)
		expect(snapshot.absencePercent).toBe(8);
	});

	it('calcula presentsPercent sobre los registros cargados (ignora clases sin asistencia tomada)', () => {
		// 100 registros, presentes 92 + tardes 2 = 94 -> 94%, NO 47% (94/200)
		const snapshot = new CourseSnapshot('course-1', 10, '3° A', 20, 92, 6, 2, 0);

		expect(snapshot.presentsPercent).toBe(94);
	});

	it('calcula absencePercent cuando todos los registros posibles fueron cargados', () => {
		// 10 clases x 20 alumnos = 200 registros, todos cargados
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

	it('retorna 0 en los porcentajes si no hay registros (evita division por cero)', () => {
		// Clases programadas pero ninguna asistencia tomada.
		const snapshot = new CourseSnapshot('course-1', 10, '3° A', 25, 0, 0, 0, 0);

		expect(snapshot.absencePercent).toBe(0);
		expect(snapshot.presentsPercent).toBe(0);
	});

	it('retorna 0 en los porcentajes si no hay clases esperadas ni registros', () => {
		const snapshot = new CourseSnapshot('course-1', 0, '3° A', 25, 0, 0, 0, 0);

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

		// 10 registros cargados: 2 tardes -> 20% de asistencia, 10/10 con falta -> 100%
		expect(snapshot.presentsPercent).toBe(20);
		expect(snapshot.absencePercent).toBe(100);
	});

	it('no diluye los porcentajes cuando la clase fue cargada parcialmente', () => {
		// Solo 5 de 20 alumnos registrados ese dia: 4 presentes + 1 ausente.
		const snapshot = new CourseSnapshot('course-1', 10, '3° A', 20, 4, 1, 0, 0);

		// 1 de 5 registros con falta -> 20%, no 0.25% (1/400)
		expect(snapshot.absencePercent).toBe(20);
		// 4 de 5 presentes -> 80%
		expect(snapshot.presentsPercent).toBe(80);
	});

	it('marca riesgo critico cuando absencePercent supera el umbral', () => {
		// 20 registros cargados; 18 ausentes = 90%
		const snapshot = new CourseSnapshot('course-1', 4, '3° A', 5, 0, 18, 0, 2);

		expect(snapshot.getRiskStatus(75, 85)).toBe(COURSE_RISK_STATUS.CRITICAL);
	});
});
