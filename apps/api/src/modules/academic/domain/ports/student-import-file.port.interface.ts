/** Fixed columns of the student import template, in file order. */
export const STUDENT_IMPORT_HEADERS = [
	'Apellido',
	'Nombre',
	'DNI',
	'Fecha de nacimiento',
	'Nombre del tutor',
	'Teléfono del tutor',
	'Email del tutor (opcional)',
] as const;

export const STUDENT_IMPORT_MAX_ROWS = 100;
export const STUDENT_IMPORT_MAX_FILE_BYTES = 1024 * 1024;

/** A data row exactly as read from the file, before any validation. */
export interface RawImportRow {
	/** 1-based row number in the worksheet (the header is row 1). */
	rowNumber: number;
	lastName: string;
	firstName: string;
	documentNumber: string;
	/** Excel date cells arrive as Date, typed text as string. */
	birthDate: Date | string | null;
	tutorName: string;
	tutorPhone: string;
	tutorEmail: string;
}

export interface IStudentImportFilePort {
	/**
	 * Reads the first worksheet. Fully empty rows are skipped.
	 * Throws BadRequestException on an unreadable file, a header mismatch
	 * or more than STUDENT_IMPORT_MAX_ROWS data rows.
	 */
	parse(buffer: Buffer): Promise<RawImportRow[]>;
	buildTemplate(): Promise<Buffer>;
}
