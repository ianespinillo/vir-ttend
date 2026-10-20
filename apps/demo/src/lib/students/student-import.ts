/**
 * Demo student import — offline replica of the product's bulk import.
 *
 * The product validates an .xlsx template on the API. The demo has no server
 * and no spreadsheet dependency, so it:
 * - offers a CSV template (same columns as the product template);
 * - validates an uploaded CSV with the same row rules (required fields, a
 *   7-8 digit document, YYYY-MM-DD birth date, duplicated documents);
 * - for any other file (e.g. the product's .xlsx) previews a built-in sample of
 *   students so the whole flow can be shown without preparing a file.
 */

import type {
	IStudentImportPreviewResponse,
	IStudentImportRow,
	IStudentImportRowData,
} from '@repo/common';

export const IMPORT_TEMPLATE_FILENAME = 'plantilla-alumnos.csv';

/** Columns of the template, in order. */
export const IMPORT_TEMPLATE_COLUMNS = [
	'Apellido',
	'Nombre',
	'DNI',
	'Fecha de nacimiento (AAAA-MM-DD)',
	'Tutor',
	'Teléfono del tutor',
	'Email del tutor',
] as const;

const SAMPLE_ROWS: string[][] = [
	[
		'Acosta',
		'Valeria',
		'41000101',
		'2009-03-14',
		'Marta Acosta',
		'11-5000-0101',
		'marta.acosta@gmail.com',
	],
	[
		'Benítez',
		'Lucas',
		'41000102',
		'2009-07-02',
		'Raúl Benítez',
		'11-5000-0102',
		'',
	],
	[
		'Cáceres',
		'Milagros',
		'41000103',
		'2009-11-23',
		'Ana Cáceres',
		'11-5000-0103',
		'',
	],
	[
		'Duarte',
		'Emiliano',
		'41000104',
		'2009-05-30',
		'Pedro Duarte',
		'11-5000-0104',
		'',
	],
	[
		'Esquivel',
		'Rocío',
		'41000105',
		'2009-09-09',
		'Sandra Esquivel',
		'11-5000-0105',
		'',
	],
];

/** CSV content of the downloadable template (headers plus one example row). */
export function buildImportTemplateCsv(): string {
	const example = [
		'Pérez',
		'Juan',
		'42123456',
		'2009-04-15',
		'María Pérez',
		'11-5555-1234',
		'maria.perez@gmail.com',
	];
	return `${[IMPORT_TEMPLATE_COLUMNS.join(';'), example.join(';')].join('\n')}\n`;
}

/** Splits CSV text (comma or semicolon separated) into trimmed cells. */
export function parseCsv(text: string): string[][] {
	const lines = text
		.replace(/^﻿/, '')
		.split(/\r?\n/)
		.filter((line) => line.trim() !== '');
	if (lines.length === 0) return [];
	const separator = (lines[0] ?? '').includes(';') ? ';' : ',';
	return lines.map((line) => line.split(separator).map((cell) => cell.trim()));
}

function isValidDate(value: string): boolean {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
	const date = new Date(`${value}T00:00:00.000Z`);
	return (
		!Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
	);
}

/** Validates the rows of a template (header row excluded) like the product. */
export function validateImportRows(
	rows: string[][],
	courseId: string,
	existingDocuments: ReadonlySet<string>,
): IStudentImportPreviewResponse {
	const seen = new Set<string>();
	const validated: IStudentImportRow[] = rows.map((cells, index) => {
		const [
			lastName = '',
			firstName = '',
			documentNumber = '',
			birthDate = '',
			tutorName = '',
			tutorPhone = '',
			tutorEmail = '',
		] = cells;
		const errors: string[] = [];
		if (!lastName) errors.push('El apellido es obligatorio');
		if (!firstName) errors.push('El nombre es obligatorio');
		if (!/^\d{7,8}$/.test(documentNumber)) {
			errors.push('El DNI debe tener 7 u 8 dígitos');
		} else if (existingDocuments.has(documentNumber)) {
			errors.push('Ya existe un alumno con ese DNI');
		} else if (seen.has(documentNumber)) {
			errors.push('El DNI está repetido en el archivo');
		}
		if (!isValidDate(birthDate)) {
			errors.push('La fecha de nacimiento debe tener el formato AAAA-MM-DD');
		}
		if (!tutorName) errors.push('El tutor es obligatorio');
		if (!tutorPhone) errors.push('El teléfono del tutor es obligatorio');
		if (tutorEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tutorEmail)) {
			errors.push('El email del tutor no es válido');
		}
		if (/^\d{7,8}$/.test(documentNumber)) seen.add(documentNumber);
		const data: IStudentImportRowData = {
			lastName,
			firstName,
			documentNumber,
			birthDate,
			tutorName,
			tutorPhone,
			tutorEmail: tutorEmail || null,
		};
		return { rowNumber: index + 2, data, errors };
	});
	const invalidRows = validated.filter((row) => row.errors.length > 0).length;
	return {
		courseId,
		totalRows: validated.length,
		validRows: validated.length - invalidRows,
		invalidRows,
		rows: validated,
	};
}

/**
 * Preview of an uploaded file. CSV files are parsed (a header row is skipped);
 * any other file previews the built-in sample.
 */
export async function previewImportFile(
	file: File,
	courseId: string,
	existingDocuments: ReadonlySet<string>,
): Promise<IStudentImportPreviewResponse> {
	const isCsv = /\.(csv|txt)$/i.test(file.name);
	if (!isCsv) {
		return validateImportRows(SAMPLE_ROWS, courseId, existingDocuments);
	}
	const rows = parseCsv(await file.text());
	const first = rows[0]?.[0]?.toLowerCase() ?? '';
	const dataRows = first === 'apellido' ? rows.slice(1) : rows;
	return validateImportRows(dataRows, courseId, existingDocuments);
}

/** The rows of a preview that can be imported. */
export function validPreviewRows(
	preview: IStudentImportPreviewResponse,
): IStudentImportRowData[] {
	return preview.rows
		.filter((row) => row.errors.length === 0)
		.map((row) => row.data);
}
