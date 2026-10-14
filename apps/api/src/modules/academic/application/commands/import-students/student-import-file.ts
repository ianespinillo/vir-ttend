import { BadRequestException } from '@nestjs/common';
import { STUDENT_IMPORT_MAX_FILE_BYTES } from '../../../domain/ports/student-import-file.port.interface';

export interface StudentImportFile {
	buffer: Buffer;
	originalName: string;
	mimeType: string;
	size: number;
}

const ACCEPTED_MIME_TYPES = new Set([
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	// Some browsers/OSes send a generic type for .xlsx uploads.
	'application/octet-stream',
]);

export function assertStudentImportFile(
	file: StudentImportFile | undefined,
): asserts file is StudentImportFile {
	if (!file) {
		throw new BadRequestException(
			'Debe adjuntar un archivo .xlsx en el campo "file"',
		);
	}
	if (
		!file.originalName.toLowerCase().endsWith('.xlsx') ||
		!ACCEPTED_MIME_TYPES.has(file.mimeType)
	) {
		throw new BadRequestException('El archivo debe ser un .xlsx');
	}
	if (file.size > STUDENT_IMPORT_MAX_FILE_BYTES) {
		throw new BadRequestException('El archivo supera el tamaño máximo de 1 MB');
	}
}
