import { Workbook } from 'exceljs';
import { ExcelRow } from '../../../src/modules/reporting/domain/types/excel-row.type';
import { ExcelGeneratorService } from '../../../src/modules/reporting/infrastructure/services/excel-generator.service';

interface ConditionalFormat {
	ref: string;
	rules: unknown[];
}

const loadSheet = async (buffer: Buffer) => {
	const workbook = new Workbook();
	await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
	return workbook.worksheets[0];
};

const rowValues = (row: { values: unknown }) =>
	(row.values as (string | number)[]).slice(1);

const conditionalFormattings = (sheet: unknown): ConditionalFormat[] =>
	(sheet as { conditionalFormattings: ConditionalFormat[] })
		.conditionalFormattings;

const rows: ExcelRow[] = [
	{
		surname: 'García',
		name: 'Juan',
		documentNumber: '35123456',
		present: 18,
		absent: 1,
		late: 2,
		justified: 1,
		absencePercent: 10,
		status: 'ok',
	},
	{
		surname: 'Pérez',
		name: 'Ana',
		documentNumber: '40234567',
		present: 10,
		absent: 5,
		late: 3,
		justified: 1,
		absencePercent: 55,
		status: 'at-risk',
	},
	{
		surname: 'López',
		name: 'Carlos',
		documentNumber: '38123456',
		present: 4,
		absent: 12,
		late: 5,
		justified: 0,
		absencePercent: 85,
		status: 'exceeded',
	},
];

const fractional: ExcelRow[] = [
	{ ...rows[0], absent: 12.5, absencePercent: 62.5 },
	{ ...rows[1], absent: 10.25, absencePercent: null },
];

describe('ExcelGeneratorService', () => {
	let service: ExcelGeneratorService;

	beforeEach(() => {
		service = new ExcelGeneratorService();
	});

	it('devuelve un buffer XLSX válido', async () => {
		const buffer = (await service.generate(rows, 'Reporte')) as unknown as Buffer;

		expect(Buffer.isBuffer(buffer)).toBe(true);
		expect(buffer.length).toBeGreaterThan(0);
		expect(buffer.subarray(0, 2).toString()).toBe('PK');
	});

	it('genera una hoja con encabezado, datos y fila de totales', async () => {
		const buffer = (await service.generate(rows, 'Reporte')) as unknown as Buffer;
		const sheet = await loadSheet(buffer);

		expect(sheet.rowCount).toBe(rows.length + 2);
	});

	it('escribe los encabezados esperados', async () => {
		const buffer = (await service.generate(rows, 'Reporte')) as unknown as Buffer;
		const sheet = await loadSheet(buffer);

		expect(rowValues(sheet.getRow(1))).toEqual([
			'Apellido',
			'Nombre',
			'Documento',
			'Presentes',
			'Inasistencias',
			'Tardanzas',
			'Justificados',
			'%',
			'Estado',
		]);
	});

	it('traduce el estado a una etiqueta legible', async () => {
		const buffer = (await service.generate(rows, 'Reporte')) as unknown as Buffer;
		const sheet = await loadSheet(buffer);

		expect(sheet.getRow(2).getCell(9).value).toBe('OK');
		expect(sheet.getRow(3).getCell(9).value).toBe('En riesgo');
		expect(sheet.getRow(4).getCell(9).value).toBe('Excedido');
	});

	it('agrega una fila de totales con las sumas', async () => {
		const buffer = (await service.generate(rows, 'Reporte')) as unknown as Buffer;
		const sheet = await loadSheet(buffer);

		const totals = sheet.getRow(rows.length + 2);
		expect(totals.getCell(1).value).toBe('Total');
		expect(totals.getCell(4).value).toBe(32);
		expect(totals.getCell(5).value).toBe(18);
		expect(totals.getCell(6).value).toBe(10);
		expect(totals.getCell(7).value).toBe(2);
		expect(totals.getCell(8).value).toBe(50);
	});

	it('escribe los conteos fraccionarios como números exactos, sin redondear', async () => {
		const buffer = (await service.generate(
			fractional,
			'Reporte',
		)) as unknown as Buffer;
		const sheet = await loadSheet(buffer);

		expect(sheet.getRow(2).getCell(5).value).toBe(12.5);
		expect(sheet.getRow(3).getCell(5).value).toBe(10.25);
		expect(sheet.getRow(4).getCell(5).value).toBe(22.75);
	});

	it('deja vacío el porcentaje de un alumno sin clases dadas y lo excluye del promedio', async () => {
		const buffer = (await service.generate(
			fractional,
			'Reporte',
		)) as unknown as Buffer;
		const sheet = await loadSheet(buffer);

		expect(sheet.getRow(3).getCell(8).value).toBeNull();
		expect(sheet.getRow(4).getCell(8).value).toBe(62.5);
	});

	it('estiliza el encabezado con fondo azul y texto en negrita', async () => {
		const buffer = (await service.generate(rows, 'Reporte')) as unknown as Buffer;
		const sheet = await loadSheet(buffer);

		const header = sheet.getRow(1);
		expect(header.font.bold).toBe(true);
		expect(header.font.color?.argb).toBe('FFFFFFFF');
		expect(header.fill).toMatchObject({ fgColor: { argb: 'FF1F4E78' } });
	});

	it('aplica formato condicional a la columna %', async () => {
		const buffer = (await service.generate(rows, 'Reporte')) as unknown as Buffer;
		const sheet = await loadSheet(buffer);

		const formattings = conditionalFormattings(sheet);
		expect(formattings).toHaveLength(1);
		expect(formattings[0].ref).toBe('H2:H4');
		expect(formattings[0].rules).toHaveLength(3);
	});
});
