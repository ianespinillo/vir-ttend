import { BadRequestException } from '@nestjs/common';
import { Workbook } from 'exceljs';
import { STUDENT_IMPORT_HEADERS } from '../../../../src/modules/academic/domain/ports/student-import-file.port.interface';
import { XlsxStudentImportFileAdapter } from '../../../../src/modules/academic/infrastructure/adapters/xlsx-student-import-file.adapter';

// xlsx-student-import-file.adapter.spec.ts
type Cell = string | number | Date | null;

const build = async (
	rows: Cell[][],
	headers: string[] = [...STUDENT_IMPORT_HEADERS],
): Promise<Buffer> => {
	const wb = new Workbook();
	const ws = wb.addWorksheet('Alumnos');
	ws.addRow(headers);
	for (const r of rows) ws.addRow(r);
	return Buffer.from(await wb.xlsx.writeBuffer());
};

const validRow = (dni: Cell = '45233210'): Cell[] => [
	'González',
	'Sofía',
	dni,
	'15/03/2014',
	'María González',
	'1155551234',
	'maria@example.com',
];

describe('XlsxStudentImportFileAdapter', () => {
	const adapter = new XlsxStudentImportFileAdapter();

	it('parses data rows with their worksheet row numbers', async () => {
		const rows = await adapter.parse(await build([validRow()]));

		expect(rows).toEqual([
			{
				rowNumber: 2,
				lastName: 'González',
				firstName: 'Sofía',
				documentNumber: '45233210',
				birthDate: '15/03/2014',
				tutorName: 'María González',
				tutorPhone: '1155551234',
				tutorEmail: 'maria@example.com',
			},
		]);
	});

	it('accepts headers regardless of case, accents and the optional marker', async () => {
		const headers = [
			' APELLIDO ',
			'nombre',
			'dni',
			'fecha de nacimiento',
			'Nombre del Tutor',
			'telefono del tutor',
			'Email del tutor',
		];
		const rows = await adapter.parse(await build([validRow()], headers));

		expect(rows).toHaveLength(1);
	});

	it('rejects a header that does not match the template', async () => {
		const headers: string[] = [...STUDENT_IMPORT_HEADERS];
		headers[2] = 'Documento';

		await expect(adapter.parse(await build([], headers))).rejects.toThrow(
			BadRequestException,
		);
	});

	it('rejects extra columns in the header', async () => {
		const headers = [...STUDENT_IMPORT_HEADERS, 'Observaciones'];

		await expect(adapter.parse(await build([], headers))).rejects.toThrow(
			BadRequestException,
		);
	});

	it('ignores fully empty rows but keeps the row numbers', async () => {
		const rows = await adapter.parse(
			await build([
				validRow('45233210'),
				[null, null, null, null, null, null, null],
				['', '', '', '', '', '', ''],
				validRow('40111222'),
			]),
		);

		expect(rows.map((r) => r.rowNumber)).toEqual([2, 5]);
	});

	it('reads Excel date cells as Date', async () => {
		const date = new Date(Date.UTC(2014, 2, 15));
		const row = validRow();
		row[3] = date;

		const [parsed] = await adapter.parse(await build([row]));

		expect(parsed.birthDate).toBeInstanceOf(Date);
		expect((parsed.birthDate as Date).toISOString()).toBe(date.toISOString());
	});

	it('reads numeric DNI and phone cells as strings', async () => {
		const row = validRow(45233210);
		row[5] = 1155551234;

		const [parsed] = await adapter.parse(await build([row]));

		expect(parsed.documentNumber).toBe('45233210');
		expect(parsed.tutorPhone).toBe('1155551234');
	});

	it('returns an empty birth date as null', async () => {
		const row = validRow();
		row[3] = null;

		const [parsed] = await adapter.parse(await build([row]));

		expect(parsed.birthDate).toBeNull();
	});

	it('accepts exactly 100 rows and rejects 101', async () => {
		const hundred = Array.from({ length: 100 }, (_, i) =>
			validRow(String(10000000 + i)),
		);
		await expect(adapter.parse(await build(hundred))).resolves.toHaveLength(100);

		await expect(
			adapter.parse(await build([...hundred, validRow('20000000')])),
		).rejects.toThrow(BadRequestException);
	});

	it('rejects a file that is not a valid xlsx', async () => {
		await expect(adapter.parse(Buffer.from('not an xlsx'))).rejects.toThrow(
			BadRequestException,
		);
	});

	it('builds a template that the parser accepts with no rows', async () => {
		const template = await adapter.buildTemplate();

		await expect(adapter.parse(template)).resolves.toEqual([]);
		const wb = new Workbook();
		await wb.xlsx.load(template as unknown as ArrayBuffer);
		expect(wb.worksheets[0].getRow(1).values).toEqual([
			undefined,
			...STUDENT_IMPORT_HEADERS,
		]);
		expect(wb.worksheets).toHaveLength(2);
	});
});
