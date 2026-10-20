import { describe, expect, it } from 'vitest';
import {
	buildImportTemplateCsv,
	parseCsv,
	previewImportFile,
	validPreviewRows,
	validateImportRows,
} from './student-import';

const none = new Set<string>();

describe('student import simulation', () => {
	it('builds a template with the product columns and one example row', () => {
		const rows = parseCsv(buildImportTemplateCsv());
		expect(rows).toHaveLength(2);
		expect(rows[0]).toHaveLength(7);
		expect(rows[0]?.[0]).toBe('Apellido');
	});

	it('validates rows like the product (required, DNI, date, email)', () => {
		const preview = validateImportRows(
			[
				['Gómez', 'Ana', '42000001', '2009-02-03', 'Tutor', '11-1', 'a@b.com'],
				['', 'Sin Apellido', '123', '2009-13-45', '', '', 'no-email'],
			],
			'course-1',
			none,
		);
		expect(preview).toMatchObject({
			courseId: 'course-1',
			totalRows: 2,
			validRows: 1,
			invalidRows: 1,
		});
		const invalid = preview.rows[1];
		expect(invalid?.rowNumber).toBe(3);
		expect(invalid?.errors).toEqual(
			expect.arrayContaining([
				'El apellido es obligatorio',
				'El DNI debe tener 7 u 8 dígitos',
				'La fecha de nacimiento debe tener el formato AAAA-MM-DD',
				'El tutor es obligatorio',
				'El email del tutor no es válido',
			]),
		);
	});

	it('flags documents already enrolled and repeated in the file', () => {
		const row = ['López', 'Eva', '42000002', '2009-02-03', 'T', '11-1', ''];
		const preview = validateImportRows(
			[row, row, ['Paz', 'Leo', '42000003', '2009-02-03', 'T', '11-1', '']],
			'c',
			new Set(['42000003']),
		);
		expect(preview.rows[0]?.errors).toEqual([]);
		expect(preview.rows[1]?.errors).toEqual([
			'El DNI está repetido en el archivo',
		]);
		expect(preview.rows[2]?.errors).toEqual(['Ya existe un alumno con ese DNI']);
		expect(validPreviewRows(preview)).toHaveLength(1);
	});

	it('parses a CSV upload and skips its header row', async () => {
		const file = new File(
			[`${buildImportTemplateCsv()}Ruiz;Tomás;42000009;2009-01-01;Tutor;11-2;\n`],
			'alumnos.csv',
			{ type: 'text/csv' },
		);
		const preview = await previewImportFile(file, 'c', none);
		expect(preview.totalRows).toBe(2);
		expect(preview.validRows).toBe(2);
	});

	it('previews a built-in sample for an .xlsx upload', async () => {
		const file = new File(['binary'], 'alumnos.xlsx');
		const preview = await previewImportFile(file, 'c', none);
		expect(preview.totalRows).toBe(5);
		expect(preview.invalidRows).toBe(0);
	});
});
