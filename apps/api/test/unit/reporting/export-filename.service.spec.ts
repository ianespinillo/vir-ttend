import { mock } from 'jest-mock-extended';
import { Student } from '../../../src/modules/reporting/domain/entities/student.entity';
import { ICoursePort } from '../../../src/modules/reporting/domain/ports/course.port.interface';
import { IStudentPort } from '../../../src/modules/reporting/domain/ports/student.port.interface';
import { ExportFilenameService } from '../../../src/modules/reporting/domain/services/export-filename.service';

function makeService() {
	const coursePort = mock<ICoursePort>();
	const studentPort = mock<IStudentPort>();
	const service = new ExportFilenameService(coursePort, studentPort);
	return { service, coursePort, studentPort };
}

describe('ExportFilenameService', () => {
	it('nombra el reporte mensual con el curso, el mes y el año', async () => {
		const { service, coursePort } = makeService();
		coursePort.findById.mockResolvedValue({
			name: '4° 2 - Turno Mañana',
		} as never);

		const filename = await service.build({
			courseId: 'course-1',
			month: 3,
			year: 2026,
			extension: 'xlsx',
		});

		expect(filename).toBe('asistencia-4-2-turno-ma-ana-marzo-2026.xlsx');
	});

	it('usa "curso" como respaldo si el curso no existe', async () => {
		const { service, coursePort } = makeService();
		coursePort.findById.mockResolvedValue(null);

		const filename = await service.build({
			courseId: 'course-1',
			month: 12,
			year: 2026,
			extension: 'pdf',
		});

		expect(filename).toBe('asistencia-curso-diciembre-2026.pdf');
	});

	it('nombra el legajo del alumno con su nombre y el año', async () => {
		const { service, studentPort } = makeService();
		studentPort.findStudent.mockResolvedValue(
			Student.reconstitute({
				id: 'student-1',
				name: 'García, Juan',
				documentNumber: '35123456',
			}),
		);

		const filename = await service.build({
			courseId: 'course-1',
			month: 3,
			year: 2026,
			extension: 'pdf',
			type: 'student',
			studentId: 'student-1',
		});

		expect(filename).toBe('legajo-garc-a-juan-2026.pdf');
		expect(studentPort.findStudent).toHaveBeenCalledWith('student-1');
	});

	it('usa "alumno" como respaldo si el estudiante no existe', async () => {
		const { service, studentPort } = makeService();
		studentPort.findStudent.mockResolvedValue(null);

		const filename = await service.build({
			courseId: 'course-1',
			month: 3,
			year: 2026,
			extension: 'xlsx',
			type: 'student',
			studentId: 'student-404',
		});

		expect(filename).toBe('legajo-alumno-2026.xlsx');
	});
});
