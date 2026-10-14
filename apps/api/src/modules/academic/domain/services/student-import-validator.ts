import { Email } from '../../../identity/domain/value-objects/email.vo';
import { RawImportRow } from '../ports/student-import-file.port.interface';
import { DocumentNumber } from '../value-objects/document-number.vo';

export interface ImportRowData {
	lastName: string;
	firstName: string;
	/** Normalized when valid, otherwise as typed. */
	documentNumber: string;
	/** ISO yyyy-mm-dd when valid, otherwise the text as typed (or null). */
	birthDate: string | null;
	tutorName: string;
	tutorPhone: string;
	tutorEmail: string | null;
}

export interface ImportPreviewRow {
	rowNumber: number;
	data: ImportRowData;
	errors: string[];
}

export interface StudentImportPreview {
	courseId: string;
	totalRows: number;
	validRows: number;
	invalidRows: number;
	rows: ImportPreviewRow[];
}

export interface ImportValidationContext {
	/** Normalized DNI -> label of the course that already holds it. */
	existingCourseLabelByDocument: ReadonlyMap<string, string>;
	today: Date;
}

const squash = (text: string): string => text.replace(/\s+/g, ' ').trim();

const pad = (n: number): string => String(n).padStart(2, '0');

const isoOf = (y: number, m: number, d: number): string | null => {
	const date = new Date(Date.UTC(y, m - 1, d));
	const real =
		date.getUTCFullYear() === y &&
		date.getUTCMonth() === m - 1 &&
		date.getUTCDate() === d;
	return real ? `${y}-${pad(m)}-${pad(d)}` : null;
};

/** Normalizes a typed DNI: strips dots, dashes and spaces. */
export const normalizeDocument = (raw: string): string =>
	raw.replace(/[.\-\s]/g, '');

const parseBirthDate = (
	raw: Date | string | null,
	today: Date,
): { iso: string | null; shown: string | null; error?: string } => {
	if (raw === null) {
		return {
			iso: null,
			shown: null,
			error: 'La fecha de nacimiento es obligatoria',
		};
	}
	let iso: string | null;
	if (raw instanceof Date) {
		iso = Number.isNaN(raw.getTime())
			? null
			: isoOf(raw.getUTCFullYear(), raw.getUTCMonth() + 1, raw.getUTCDate());
	} else {
		const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(raw.trim());
		iso = m ? isoOf(Number(m[3]), Number(m[2]), Number(m[1])) : null;
	}
	if (!iso) {
		const shown = raw instanceof Date ? null : raw;
		return {
			iso: null,
			shown,
			error: 'La fecha de nacimiento no es válida (use DD/MM/AAAA)',
		};
	}
	const todayIso = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
	if (iso > todayIso) {
		return {
			iso,
			shown: iso,
			error: 'La fecha de nacimiento no puede ser futura',
		};
	}
	if (iso < '1900-01-01') {
		return { iso, shown: iso, error: 'La fecha de nacimiento no es válida' };
	}
	return { iso, shown: iso };
};

/**
 * Single source of validation for imported rows. Reuses the domain value
 * objects (DocumentNumber, Email) so the rules match the one-by-one flow.
 */
export function validateImportRows(
	courseId: string,
	rows: RawImportRow[],
	ctx: ImportValidationContext,
): StudentImportPreview {
	const firstRowByDocument = new Map<string, number>();

	const previewRows = rows.map((row): ImportPreviewRow => {
		const errors: string[] = [];
		const lastName = squash(row.lastName);
		const firstName = squash(row.firstName);
		const tutorName = squash(row.tutorName);
		const tutorPhone = squash(row.tutorPhone);
		const emailText = row.tutorEmail.trim();

		if (!lastName) errors.push('El apellido es obligatorio');
		if (!firstName) errors.push('El nombre es obligatorio');
		if (!tutorName) errors.push('El nombre del tutor es obligatorio');
		if (!tutorPhone) errors.push('El teléfono del tutor es obligatorio');

		const document = normalizeDocument(row.documentNumber);
		let validDocument = false;
		if (!document) {
			errors.push('El DNI es obligatorio');
		} else if (!/^\d{8}$/.test(document)) {
			errors.push('El DNI debe tener 8 dígitos');
		} else {
			try {
				new DocumentNumber(document);
				validDocument = true;
			} catch {
				errors.push('El DNI no es válido');
			}
		}
		if (validDocument) {
			const first = firstRowByDocument.get(document);
			if (first === undefined) {
				firstRowByDocument.set(document, row.rowNumber);
			} else {
				errors.push(`El DNI está repetido en el archivo (fila ${first})`);
			}
			const label = ctx.existingCourseLabelByDocument.get(document);
			if (label !== undefined) {
				errors.push(`El DNI ya está cargado en ${label}`);
			}
		}

		const birth = parseBirthDate(row.birthDate, ctx.today);
		if (birth.error) errors.push(birth.error);

		if (emailText) {
			try {
				new Email(emailText);
			} catch {
				errors.push('El email del tutor no es válido');
			}
		}

		return {
			rowNumber: row.rowNumber,
			data: {
				lastName,
				firstName,
				documentNumber: document,
				birthDate: birth.shown,
				tutorName,
				tutorPhone,
				tutorEmail: emailText || null,
			},
			errors,
		};
	});

	const invalidRows = previewRows.filter((r) => r.errors.length > 0).length;
	return {
		courseId,
		totalRows: previewRows.length,
		validRows: previewRows.length - invalidRows,
		invalidRows,
		rows: previewRows,
	};
}
