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

	describe('template styling', () => {
		const load = async () => {
			const wb = new Workbook();
			await wb.xlsx.load(
				(await adapter.buildTemplate()) as unknown as ArrayBuffer,
			);
			return wb;
		};

		it('styles the header row and freezes it', async () => {
			const sheet = (await load()).getWorksheet('Alumnos');
			const cell = sheet?.getCell('A1');

			expect(cell?.font?.bold).toBe(true);
			expect(cell?.font?.color?.argb).toBe('FFFFFFFF');
			expect(cell?.fill).toMatchObject({ fgColor: { argb: 'FF1F4E78' } });
			expect(sheet?.views[0]).toMatchObject({ state: 'frozen', ySplit: 1 });
		});

		it('tints the optional column header differently', async () => {
			const sheet = (await load()).getWorksheet('Alumnos');
			const required = sheet?.getCell('A1').fill as { fgColor: { argb: string } };
			const optional = sheet?.getCell('G1').fill as { fgColor: { argb: string } };

			expect(optional.fgColor.argb).not.toBe(required.fgColor.argb);
		});

		it('pre-formats input rows without values', async () => {
			const sheet = (await load()).getWorksheet('Alumnos');

			expect(sheet?.getCell('C2').numFmt).toBe('@');
			expect(sheet?.getCell('D2').numFmt).toBe('dd/mm/yyyy');
			expect(sheet?.getCell('C101').numFmt).toBe('@');
			expect(sheet?.getCell('A2').border?.top?.style).toBe('thin');
			expect(sheet?.getCell('A2').value).toBeNull();
		});

		it('validates the birth date and DNI columns', async () => {
			const sheet = (await load()).getWorksheet('Alumnos');

			expect(sheet?.getCell('D2').dataValidation).toMatchObject({
				type: 'date',
				errorStyle: 'warning',
			});
			expect(sheet?.getCell('C2').dataValidation).toMatchObject({
				type: 'textLength',
				errorStyle: 'warning',
			});
		});

		it('documents every column with an example in the help sheet', async () => {
			const help = (await load()).getWorksheet('Instrucciones');
			const rows: string[][] = [];
			help?.eachRow((row) => {
				rows.push([1, 2, 3, 4].map((c) => String(row.getCell(c).value ?? '')));
			});
			const headerIndex = rows.findIndex((r) => r[0] === 'Columna');

			expect(rows[headerIndex]).toEqual([
				'Columna',
				'Obligatoria',
				'Formato',
				'Ejemplo',
			]);
			const guide = rows.slice(headerIndex + 1);
			expect(guide.map((r) => r[0])).toEqual([...STUDENT_IMPORT_HEADERS]);
			expect(guide.every((r) => r[3] !== '')).toBe(true);
		});

		it('keeps a filled template parseable', async () => {
			const wb = await load();
			const sheet = wb.getWorksheet('Alumnos');
			if (!sheet) throw new Error('template has no "Alumnos" sheet');
			validRow().forEach((value, i) => {
				sheet.getCell(2, i + 1).value = value as string;
			});
			const buffer = Buffer.from(await wb.xlsx.writeBuffer());

			const rows = await adapter.parse(buffer);

			expect(rows).toHaveLength(1);
			expect(rows[0]).toMatchObject({ rowNumber: 2, documentNumber: '45233210' });
		});
	});
});
