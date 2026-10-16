import {
	ForbiddenException,
	Inject,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { JwtPayload, ROLES } from '@repo/common';
import { Course } from '../../../domain/entities/course.entity';
import { RawImportRow } from '../../../domain/ports/student-import-file.port.interface';
import { ICourseRepository } from '../../../domain/repositories/course.repository.interface';
import { IStudentRepository } from '../../../domain/repositories/student.repository.interface';
import {
	StudentImportPreview,
	normalizeDocument,
	validateImportRows,
} from '../../../domain/services/student-import-validator';

@Injectable()
export class StudentImportService {
	constructor(
		@Inject('ICourseRepository')
		private readonly courseRepo: ICourseRepository,
		@Inject('IStudentRepository')
		private readonly studentRepo: IStudentRepository,
	) {}

	/** Loads the target course and enforces tenant and preceptor scoping. */
	async loadAuthorizedCourse(
		courseId: string,
		user: JwtPayload,
	): Promise<Course> {
		const course = await this.courseRepo.findById(courseId);
		if (!course || course.tenantId !== user.tenantId) {
			throw new NotFoundException('Curso no encontrado');
		}
		if (user.role === ROLES.PRECEPTOR && course.preceptorId !== user.sub) {
			throw new ForbiddenException(
				'Solo podés importar alumnos a los cursos que tenés a cargo',
			);
		}
		return course;
	}

	/** Validates the rows; looks up existing DNIs of the tenant in one batch. */
	async validate(
		course: Course,
		rows: RawImportRow[],
	): Promise<StudentImportPreview> {
		const documents = [
			...new Set(rows.map((r) => normalizeDocument(r.documentNumber))),
		].filter((d) => /^\d{8}$/.test(d));
		const existing = await this.studentRepo.findByDocuments(
			documents,
			course.tenantId,
		);
		const courseIds = [...new Set(existing.map((s) => s.courseId))];
		const courses = await this.courseRepo.findByIds(courseIds);
		const labelByCourse = new Map(
			courses.map((c) => [c.id.getRaw(), c.label] as const),
		);
		const existingCourseLabelByDocument = new Map(
			existing.map(
				(s) =>
					[
						s.documentNumber.getValue(),
						labelByCourse.get(s.courseId) ?? 'otro curso',
					] as const,
			),
		);
		return validateImportRows(course.id.getRaw(), rows, {
			existingCourseLabelByDocument,
			today: new Date(),
		});
	}
}
