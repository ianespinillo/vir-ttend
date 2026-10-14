import { BadRequestException, Injectable } from '@nestjs/common';
import { CellValue, Row, Workbook } from 'exceljs';
import {
	IStudentImportFilePort,
	RawImportRow,
	STUDENT_IMPORT_HEADERS,
	STUDENT_IMPORT_MAX_ROWS,
} from '../../domain/ports/student-import-file.port.interface';

type CellContent = string | Date | null;

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
		const sheet = workbook.addWorksheet('Alumnos');
		sheet.columns = STUDENT_IMPORT_HEADERS.map((header) => ({
			header,
			width: Math.max(header.length + 4, 16),
		}));
		sheet.getRow(1).font = { bold: true };
		// DNI as text keeps leading zeros; dates show as DD/MM/AAAA.
		sheet.getColumn(3).numFmt = '@';
		sheet.getColumn(4).numFmt = 'dd/mm/yyyy';
		sheet.getCell('D1').note = 'Formato DD/MM/AAAA';
		sheet.getCell('G1').note = 'Columna opcional: puede quedar vacía.';

		const help = workbook.addWorksheet('Instrucciones');
		help.getColumn(1).width = 90;
		for (const line of [
			'Instrucciones para cargar alumnos',
			'1. Completá una fila por alumno en la hoja "Alumnos". No cambies los encabezados ni el orden de las columnas.',
			'2. La fecha de nacimiento se escribe con formato DD/MM/AAAA.',
			'3. El email del tutor es opcional; el resto de las columnas son obligatorias.',
			'4. Un archivo corresponde a un solo curso: el curso se elige al subir el archivo.',
			`5. Máximo ${STUDENT_IMPORT_MAX_ROWS} alumnos por archivo.`,
		]) {
			help.addRow([line]);
		}
		help.getRow(1).font = { bold: true };

		return Buffer.from(await workbook.xlsx.writeBuffer());
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
