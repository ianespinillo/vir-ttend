import { BadRequestException, Injectable } from '@nestjs/common';
import { Borders, CellValue, Fill, Row, Workbook, Worksheet } from 'exceljs';
import {
	IStudentImportFilePort,
	RawImportRow,
	STUDENT_IMPORT_HEADERS,
	STUDENT_IMPORT_MAX_ROWS,
} from '../../domain/ports/student-import-file.port.interface';

type CellContent = string | Date | null;

const solidFill = (argb: string): Fill => ({
	type: 'pattern',
	pattern: 'solid',
	bgColor: { argb },
	fgColor: { argb },
});

const HEADER_FILL = solidFill('FF1F4E78');
/** Lighter shade so the optional column reads as secondary. */
const OPTIONAL_HEADER_FILL = solidFill('FF7F9DB9');
const ZEBRA_FILL = solidFill('FFF5F7FA');

const BORDER_COLOR = { argb: 'FFD0D4DA' };
const THIN_BORDER: Partial<Borders> = {
	top: { style: 'thin', color: BORDER_COLOR },
	left: { style: 'thin', color: BORDER_COLOR },
	bottom: { style: 'thin', color: BORDER_COLOR },
	right: { style: 'thin', color: BORDER_COLOR },
};

const COLUMN_WIDTHS = [20, 20, 16, 22, 28, 22, 30];
const DNI_COLUMN = 3;
const BIRTH_DATE_COLUMN = 4;
const OPTIONAL_COLUMN = 7;

/** Per-column guide shown in the "Instrucciones" sheet; the only place with example values. */
const COLUMN_GUIDE: readonly (readonly [string, string, string])[] = [
	['Obligatoria', 'Texto', 'González'],
	['Obligatoria', 'Texto', 'Sofía'],
	['Obligatoria', 'Solo números, 7 u 8 dígitos', '45233210'],
	['Obligatoria', 'DD/MM/AAAA', '15/03/2014'],
	['Obligatoria', 'Texto', 'María González'],
	['Obligatoria', 'Solo números', '1155551234'],
	['Opcional', 'Dirección de email', 'maria@example.com'],
];

const normalizeHeader = (text: string): string =>
	text
		.normalize('NFD')
		.replace(/\p{M}/gu, '')
		.replace(/\(.*?\)/g, '')
		.replace(/\s+/g, ' ')
		.trim()
		.toLowerCase();

const unwrap = (value: CellValue | undefined): CellContent => {
	if (value === null || value === undefined) return null;
	if (value instanceof Date) return value;
	if (typeof value === 'string') return value;
	if (typeof value === 'number' || typeof value === 'boolean') {
		return String(value);
	}
	if ('richText' in value) return value.richText.map((r) => r.text).join('');
	if ('result' in value) return unwrap(value.result as CellValue);
	if ('text' in value) return unwrap(value.text as CellValue);
	return null;
};

const asText = (content: CellContent): string => {
	if (content === null) return '';
	if (content instanceof Date) return content.toISOString();
	return content.trim();
};

@Injectable()
export class XlsxStudentImportFileAdapter implements IStudentImportFilePort {
	async parse(buffer: Buffer): Promise<RawImportRow[]> {
		const workbook = new Workbook();
		try {
			await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
		} catch {
			throw new BadRequestException(
				'El archivo no es un .xlsx válido. Descargá la plantilla y volvé a cargarlo.',
			);
		}
		const sheet = workbook.worksheets[0];
		if (!sheet) {
			throw new BadRequestException('El archivo no tiene ninguna hoja.');
		}

		this.assertHeader(sheet.getRow(1));

		const rows: RawImportRow[] = [];
		for (let n = 2; n <= sheet.rowCount; n++) {
			const row = sheet.getRow(n);
			const cells = STUDENT_IMPORT_HEADERS.map((_, i) =>
				unwrap(row.getCell(i + 1).value),
			);
			if (cells.every((c) => asText(c) === '')) continue;
			if (rows.length >= STUDENT_IMPORT_MAX_ROWS) {
				throw new BadRequestException(
					`El archivo supera el máximo de ${STUDENT_IMPORT_MAX_ROWS} alumnos por carga.`,
				);
			}
			const [lastName, firstName, dni, birthDate, tutorName, phone, email] = cells;
			rows.push({
				rowNumber: n,
				lastName: asText(lastName),
				firstName: asText(firstName),
				documentNumber: asText(dni),
				birthDate:
					birthDate instanceof Date || birthDate === null
						? birthDate
						: birthDate.trim() || null,
				tutorName: asText(tutorName),
				tutorPhone: asText(phone),
				tutorEmail: asText(email),
			});
		}
		return rows;
	}

	async buildTemplate(): Promise<Buffer> {
		const workbook = new Workbook();
		this.buildDataSheet(workbook.addWorksheet('Alumnos'));
		this.buildHelpSheet(workbook.addWorksheet('Instrucciones'));
		return Buffer.from(await workbook.xlsx.writeBuffer());
	}

	/** Header stays on row 1 and rows carry styles only, never values: parse() relies on both. */
	private buildDataSheet(sheet: Worksheet): void {
		sheet.columns = STUDENT_IMPORT_HEADERS.map((header, i) => ({
			header,
			width: COLUMN_WIDTHS[i],
		}));
		sheet.views = [{ state: 'frozen', ySplit: 1 }];

		const header = sheet.getRow(1);
		header.height = 32;
		STUDENT_IMPORT_HEADERS.forEach((_, i) => {
			const cell = header.getCell(i + 1);
			cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
			cell.fill = i + 1 === OPTIONAL_COLUMN ? OPTIONAL_HEADER_FILL : HEADER_FILL;
			cell.border = THIN_BORDER;
			cell.alignment = {
				vertical: 'middle',
				horizontal: 'center',
				wrapText: true,
			};
		});
		sheet.getCell('D1').note = 'Formato DD/MM/AAAA';
		sheet.getCell('G1').note = 'Columna opcional: puede quedar vacía.';

		for (let n = 2; n <= STUDENT_IMPORT_MAX_ROWS + 1; n++) {
			STUDENT_IMPORT_HEADERS.forEach((_, i) => {
				const cell = sheet.getCell(n, i + 1);
				cell.border = THIN_BORDER;
				cell.alignment = { vertical: 'middle' };
				if (n % 2 === 1) cell.fill = ZEBRA_FILL;
			});
			// DNI as text keeps leading zeros; dates show as DD/MM/AAAA.
			const dni = sheet.getCell(n, DNI_COLUMN);
			dni.numFmt = '@';
			dni.dataValidation = {
				type: 'textLength',
				operator: 'between',
				formulae: [7, 8],
				allowBlank: true,
				showErrorMessage: true,
				errorStyle: 'warning',
				errorTitle: 'DNI',
				error: 'El DNI suele tener 7 u 8 dígitos. ¿Querés continuar igual?',
			};
			const birthDate = sheet.getCell(n, BIRTH_DATE_COLUMN);
			birthDate.numFmt = 'dd/mm/yyyy';
			birthDate.dataValidation = {
				type: 'date',
				operator: 'greaterThan',
				formulae: [new Date(Date.UTC(1900, 0, 1))],
				allowBlank: true,
				showErrorMessage: true,
				// A warning, not a stop: an Excel set to another locale stores a typed
				// DD/MM/AAAA as text, which the importer still accepts.
				errorStyle: 'warning',
				errorTitle: 'Fecha de nacimiento',
				error:
					'Se espera una fecha con formato DD/MM/AAAA. ¿Querés continuar igual?',
			};
		}
	}

	private buildHelpSheet(help: Worksheet): void {
		[28, 18, 32, 26].forEach((width, i) => {
			help.getColumn(i + 1).width = width;
		});

		const steps = [
			'1. Completá una fila por alumno en la hoja "Alumnos". No cambies los encabezados ni el orden de las columnas.',
			'2. La fecha de nacimiento se escribe con formato DD/MM/AAAA.',
			'3. El email del tutor es opcional; el resto de las columnas son obligatorias.',
			'4. Un archivo corresponde a un solo curso: el curso se elige al subir el archivo.',
			`5. Máximo ${STUDENT_IMPORT_MAX_ROWS} alumnos por archivo.`,
		];

		help.mergeCells(1, 1, 1, 4);
		const title = help.getCell(1, 1);
		title.value = 'Instrucciones para cargar alumnos';
		title.font = { bold: true, size: 16, color: { argb: 'FF1F4E78' } };
		title.alignment = { vertical: 'middle', horizontal: 'left' };
		help.getRow(1).height = 26;

		steps.forEach((step, i) => {
			const rowNumber = i + 3;
			help.mergeCells(rowNumber, 1, rowNumber, 4);
			const cell = help.getCell(rowNumber, 1);
			cell.value = step;
			cell.alignment = { vertical: 'top', wrapText: true };
			help.getRow(rowNumber).height = 32;
		});

		const guideHeaderRow = steps.length + 4;
		const guideHeader = help.getRow(guideHeaderRow);
		guideHeader.height = 22;
		['Columna', 'Obligatoria', 'Formato', 'Ejemplo'].forEach((text, i) => {
			const cell = guideHeader.getCell(i + 1);
			cell.value = text;
			cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
			cell.fill = HEADER_FILL;
			cell.border = THIN_BORDER;
			cell.alignment = { vertical: 'middle', horizontal: 'left' };
		});

		COLUMN_GUIDE.forEach(([required, format, example], i) => {
			const row = help.getRow(guideHeaderRow + 1 + i);
			[STUDENT_IMPORT_HEADERS[i], required, format, example].forEach((text, j) => {
				const cell = row.getCell(j + 1);
				cell.value = text;
				cell.border = THIN_BORDER;
				cell.alignment = { vertical: 'middle', wrapText: true };
				if (i % 2 === 1) cell.fill = ZEBRA_FILL;
			});
		});
	}

	private assertHeader(row: Row): void {
		const matches = STUDENT_IMPORT_HEADERS.every(
			(expected, i) =>
				normalizeHeader(asText(unwrap(row.getCell(i + 1).value))) ===
				normalizeHeader(expected),
		);
		let extra = false;
		row.eachCell((cell, col) => {
			if (col > STUDENT_IMPORT_HEADERS.length && asText(unwrap(cell.value))) {
				extra = true;
			}
		});
		if (!matches || extra) {
			throw new BadRequestException(
				`Los encabezados no coinciden con la plantilla. Se esperan, en orden: ${STUDENT_IMPORT_HEADERS.join(', ')}.`,
			);
		}
	}
}
