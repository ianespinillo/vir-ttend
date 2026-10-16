import { Inject, Injectable } from '@nestjs/common';
import { IStudentImportFilePort } from '../../../domain/ports/student-import-file.port.interface';

@Injectable()
export class GetStudentImportTemplateHandler {
	constructor(
		@Inject('IStudentImportFilePort')
		private readonly filePort: IStudentImportFilePort,
	) {}

	execute(): Promise<Buffer> {
		return this.filePort.buildTemplate();
	}
}
