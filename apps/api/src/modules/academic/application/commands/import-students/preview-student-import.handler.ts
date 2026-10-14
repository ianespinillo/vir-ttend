import { Inject, Injectable } from '@nestjs/common';
import { JwtPayload } from '@repo/common';
import { IStudentImportFilePort } from '../../../domain/ports/student-import-file.port.interface';
import { StudentImportPreview } from '../../../domain/services/student-import-validator';
import {
	StudentImportFile,
	assertStudentImportFile,
} from './student-import-file';
import { StudentImportService } from './student-import.service';

export class PreviewStudentImportCommand {
	constructor(
		public readonly user: JwtPayload,
		public readonly courseId: string,
		public readonly file: StudentImportFile | undefined,
	) {}
}

@Injectable()
export class PreviewStudentImportHandler {
	constructor(
		private readonly importService: StudentImportService,
		@Inject('IStudentImportFilePort')
		private readonly filePort: IStudentImportFilePort,
	) {}

	async execute(
		command: PreviewStudentImportCommand,
	): Promise<StudentImportPreview> {
		const course = await this.importService.loadAuthorizedCourse(
			command.courseId,
			command.user,
		);
		assertStudentImportFile(command.file);
		const rows = await this.filePort.parse(command.file.buffer);
		return this.importService.validate(course, rows);
	}
}
