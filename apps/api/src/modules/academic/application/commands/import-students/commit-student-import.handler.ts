import {
	Inject,
	Injectable,
	UnprocessableEntityException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtPayload } from '@repo/common';
import { Student } from '../../../domain/entities/student.entity';
import { IStudentImportFilePort } from '../../../domain/ports/student-import-file.port.interface';
import { IAcademicUnitOfWorkPort } from '../../../domain/ports/unit-of-work.port.interface';
import { IStudentRepository } from '../../../domain/repositories/student.repository.interface';
import { StudentImportPreview } from '../../../domain/services/student-import-validator';
import {
	StudentImportFile,
	assertStudentImportFile,
} from './student-import-file';
import { StudentImportService } from './student-import.service';

export class CommitStudentImportCommand {
	constructor(
		public readonly user: JwtPayload,
		public readonly courseId: string,
		public readonly file: StudentImportFile | undefined,
	) {}
}

type CommitOutcome =
	| { preview: StudentImportPreview }
	| { students: Student[] };

@Injectable()
export class CommitStudentImportHandler {
	constructor(
		private readonly importService: StudentImportService,
		@Inject('IStudentImportFilePort')
		private readonly filePort: IStudentImportFilePort,
		@Inject('IStudentRepository')
		private readonly studentRepo: IStudentRepository,
		@Inject('IAcademicUnitOfWorkPort')
		private readonly unitOfWork: IAcademicUnitOfWorkPort,
		private readonly events: EventEmitter2,
	) {}

	async execute(
		command: CommitStudentImportCommand,
	): Promise<{ created: number }> {
		const course = await this.importService.loadAuthorizedCourse(
			command.courseId,
			command.user,
		);
		assertStudentImportFile(command.file);
		const rows = await this.filePort.parse(command.file.buffer);

		// Re-validate inside the transaction so the DNI checks see the state
		// at write time; any invalid row means nothing is inserted.
		const outcome = await this.unitOfWork.run<CommitOutcome>(async () => {
			const preview = await this.importService.validate(course, rows);
			if (preview.invalidRows > 0) return { preview };
			const students: Student[] = [];
			for (const row of preview.rows) {
				const student = Student.create({
					tenantId: course.tenantId,
					courseId: preview.courseId,
					lastName: row.data.lastName,
					firstName: row.data.firstName,
					documentNumber: row.data.documentNumber,
					birthDate: new Date(row.data.birthDate as string),
					tutorName: row.data.tutorName,
					tutorPhone: row.data.tutorPhone,
					tutorEmail: row.data.tutorEmail ?? undefined,
				});
				await this.studentRepo.save(student);
				students.push(student);
			}
			return { students };
		});

		if ('preview' in outcome) {
			throw new UnprocessableEntityException({
				message: 'El archivo tiene filas con errores. No se importó ningún alumno.',
				error: 'Unprocessable Entity',
				details: outcome.preview,
			});
		}
		// Only after the transaction committed.
		for (const student of outcome.students) {
			this.events.emit('student.created', student);
		}
		return { created: outcome.students.length };
	}
}
