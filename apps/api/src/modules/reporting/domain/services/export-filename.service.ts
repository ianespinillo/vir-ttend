import { Inject, Injectable } from '@nestjs/common';
import { ICoursePort } from '../ports/course.port.interface';
import { IStudentPort } from '../ports/student.port.interface';

const MONTHS = [
	'enero',
	'febrero',
	'marzo',
	'abril',
	'mayo',
	'junio',
	'julio',
	'agosto',
	'septiembre',
	'octubre',
	'noviembre',
	'diciembre',
];

export interface ExportFilenameParams {
	courseId: string;
	month: number;
	year: number;
	extension: 'xlsx' | 'pdf';
	type?: 'monthly' | 'student';
	studentId?: string;
}

function slugify(value: string | undefined, fallback: string): string {
	return (
		(value ?? '')
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '') || fallback
	);
}

@Injectable()
export class ExportFilenameService {
	constructor(
		@Inject('ICoursePort') private readonly coursePort: ICoursePort,
		@Inject('IStudentPort') private readonly studentPort: IStudentPort,
	) {}

	async build(params: ExportFilenameParams): Promise<string> {
		const { courseId, month, year, extension, type, studentId } = params;

		if (type === 'student' && studentId) {
			const student = await this.studentPort.findStudent(studentId);
			const studentSlug = slugify(student?.name, 'alumno');
			return `legajo-${studentSlug}-${year}.${extension}`;
		}

		const course = await this.coursePort.findById(courseId);
		const courseSlug = slugify(course?.name, 'curso');
		return `asistencia-${courseSlug}-${MONTHS[month - 1]}-${year}.${extension}`;
	}
}
