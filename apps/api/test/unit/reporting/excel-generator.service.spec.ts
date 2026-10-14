import { Workbook, Worksheet } from 'exceljs';
import { ExcelRow } from '../../../src/modules/reporting/domain/types/excel-row.type';
import { ExcelGeneratorService } from '../../../src/modules/reporting/infrastructure/services/excel-generator.service';

interface ConditionalFormat {
	ref: string;
	rules: unknown[];
}

const TITLE_ROW = 1;
const SUBTITLE_ROW = 2;
const HEADER_ROW = 4;
const FIRST_DATA_ROW = 5;

const COL = {
	surname: 1,
	absent: 5,
	absentDaily: 6,
	absentWorkshop: 7,
	late: 8,
	percent: 10,
	status: 11,
};

const loadSheet = async (buffer: Buffer): Promise<Worksheet> => {
	const workbook = new Workbook();
	await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
	return workbook.worksheets[0];
};

const rowValues = (row: { values: unknown }) =>
	(row.values as (string | number)[]).slice(1);

const conditionalFormattings = (sheet: unknown): ConditionalFormat[] =>
	(sheet as { conditionalFormattings: ConditionalFormat[] })
		.conditionalFormattings;

const fillColor = (sheet: Worksheet, row: number, col: number) =>
	(sheet.getCell(row, col).fill as { fgColor?: { argb?: string } }).fgColor
		?.argb;

const rows: ExcelRow[] = [
	{
		surname: 'García',
		name: 'Juan',
		documentNumber: '35123456',
		present: 18,
		absent: 1,
		absentDaily: 1,
		absentWorkshop: 0,
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
		absentDaily: 4,
		absentWorkshop: 1,
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
		absentDaily: 10,
		absentWorkshop: 2,
		late: 5,
		justified: 0,
		absencePercent: 85,
		status: 'exceeded',
	},
];

const fractional: ExcelRow[] = [
	{
		...rows[0],
		absent: 12.5,
		absentDaily: 10,
		absentWorkshop: 2.5,
		absencePercent: 62.5,
	},
	{
		...rows[1],
		absent: 10.25,
		absentDaily: null,
		absentWorkshop: null,
		absencePercent: null,
	},
];

describe('ExcelGeneratorService', () => {
	let service: ExcelGeneratorService;

	const build = async (data: ExcelRow[], title = 'Reporte de prueba') =>
		loadSheet((await service.generate(data, title)) as unknown as Buffer);

	beforeEach(() => {
		service = new ExcelGeneratorService();
	});

	it('devuelve un buffer XLSX válido', async () => {
		const buffer = (await service.generate(rows, 'Reporte')) as unknown as Buffer;

		expect(Buffer.isBuffer(buffer)).toBe(true);
		expect(buffer.subarray(0, 2).toString()).toBe('PK');
	});

	it('nombra la hoja "Asistencia"', async () => {
		expect((await build(rows)).name).toBe('Asistencia');
	});

	it('escribe el título combinado a lo ancho de la tabla y la fecha de generación', async () => {
		const sheet = await build(rows, 'Asistencia 3° A - Julio 2026');

		const title = sheet.getCell(TITLE_ROW, 1);
		expect(title.value).toBe('Asistencia 3° A - Julio 2026');
		expect(title.font.bold).toBe(true);
		expect(title.font.size).toBeGreaterThan(11);
		expect(sheet.getCell(TITLE_ROW, 11).master.address).toBe('A1');
		expect(sheet.getCell(SUBTITLE_ROW, 1).value).toMatch(
			/^Generado el \d{2}\/\d{2}\/\d{4}$/,
		);
		expect(sheet.getCell(SUBTITLE_ROW, 11).master.address).toBe('A2');
		expect(sheet.getRow(3).hasValues).toBe(false);
	});

	it('coloca el encabezado en la fila 4 con las columnas de desglose', async () => {
		const sheet = await build(rows);

		expect(rowValues(sheet.getRow(HEADER_ROW))).toEqual([
			'Apellido',
			'Nombre',
			'Documento',
			'Presentes',
			'Inasistencias',
			'Inas. teóricas',
			'Inas. taller',
			'Tardanzas',
			'Justificados',
			'% Inasist.',
			'Estado',
		]);
	});

	it('estiliza el encabezado con fondo oscuro, texto blanco en negrita y ajuste de línea', async () => {
		const sheet = await build(rows);

		const cell = sheet.getCell(HEADER_ROW, 1);
		expect(cell.font.bold).toBe(true);
		expect(cell.font.color?.argb).toBe('FFFFFFFF');
		expect(fillColor(sheet, HEADER_ROW, 1)).toBe('FF1F4E78');
		expect(cell.alignment.wrapText).toBe(true);
		expect(cell.alignment.vertical).toBe('middle');
		expect(sheet.getRow(HEADER_ROW).height).toBeGreaterThan(15);
	});

	it('inmoviliza el encabezado y las columnas de nombre, y filtra el encabezado', async () => {
		const sheet = await build(rows);

		expect(sheet.views[0]).toMatchObject({
			state: 'frozen',
			xSplit: 2,
			ySplit: HEADER_ROW,
		});
		// A reloaded workbook exposes the filter as its range string.
		expect(sheet.autoFilter).toBe(`A${HEADER_ROW}:K${HEADER_ROW}`);
	});

	it('configura la impresión apaisada, a una página de ancho y repite el encabezado', async () => {
		const sheet = await build(rows);

		expect(sheet.pageSetup.orientation).toBe('landscape');
		expect(sheet.pageSetup.fitToWidth).toBe(1);
		expect(sheet.pageSetup.fitToHeight).toBe(0);
		expect(sheet.pageSetup.printTitlesRow).toBe('4:4');
	});

	it('traduce el estado a una etiqueta con el color de su estado', async () => {
		const sheet = await build(rows);

		const expected = [
			['OK', 'FFC6EFCE'],
			['En riesgo', 'FFFFEB9C'],
			['Excedido', 'FFFFC7CE'],
		];
		expected.forEach(([label, color], index) => {
			const row = FIRST_DATA_ROW + index;
			expect(sheet.getCell(row, COL.status).value).toBe(label);
			expect(fillColor(sheet, row, COL.status)).toBe(color);
			expect(sheet.getCell(row, COL.status).alignment.horizontal).toBe('center');
			// the percent shares the status color, so both always agree
			expect(fillColor(sheet, row, COL.percent)).toBe(color);
		});
	});

	it('no deja formato condicional por umbrales de porcentaje', async () => {
		const sheet = await build(rows);

		expect(conditionalFormattings(sheet)).toHaveLength(0);
	});

	it('alterna el sombreado de las filas de datos', async () => {
		const sheet = await build(rows);

		expect(fillColor(sheet, FIRST_DATA_ROW, COL.surname)).toBeUndefined();
		expect(fillColor(sheet, FIRST_DATA_ROW + 1, COL.surname)).toBe('FFF5F7FA');
	});

	it('escribe el desglose de inasistencias y lo deja vacío si no existe', async () => {
		const sheet = await build(fractional);

		expect(sheet.getCell(FIRST_DATA_ROW, COL.absentDaily).value).toBe(10);
		expect(sheet.getCell(FIRST_DATA_ROW, COL.absentWorkshop).value).toBe(2.5);
		expect(sheet.getCell(FIRST_DATA_ROW + 1, COL.absentDaily).value).toBeNull();
		expect(
			sheet.getCell(FIRST_DATA_ROW + 1, COL.absentWorkshop).value,
		).toBeNull();
	});

	it('escribe los conteos fraccionarios como números exactos con formato General', async () => {
		const sheet = await build(fractional);

		const first = sheet.getCell(FIRST_DATA_ROW, COL.absent);
		const second = sheet.getCell(FIRST_DATA_ROW + 1, COL.absent);
		expect(first.value).toBe(12.5);
		expect(second.value).toBe(10.25);
		expect(sheet.getCell(FIRST_DATA_ROW + 2, COL.absent).value).toBe(22.75);
		expect(first.numFmt).toBeUndefined();
	});

	it('guarda el porcentaje como número 0-100 con un decimal y signo %', async () => {
		const sheet = await build(fractional);

		const cell = sheet.getCell(FIRST_DATA_ROW, COL.percent);
		expect(cell.value).toBe(62.5);
		expect(cell.numFmt).toBe('0.0"%"');
	});

	it('deja vacío el porcentaje sin clases dadas, sin color, y lo excluye del promedio', async () => {
		const sheet = await build(fractional);

		const empty = sheet.getCell(FIRST_DATA_ROW + 1, COL.percent);
		expect(empty.value).toBeNull();
		expect(fillColor(sheet, FIRST_DATA_ROW + 1, COL.percent)).toBe('FFF5F7FA');
		expect(sheet.getCell(FIRST_DATA_ROW + 2, COL.percent).value).toBe(62.5);
	});

	it('agrega una fila de totales en negrita con las sumas ponderadas', async () => {
		const sheet = await build(rows);

		const totals = sheet.getRow(FIRST_DATA_ROW + rows.length);
		expect(totals.getCell(COL.surname).value).toBe('Total');
		expect(totals.getCell(4).value).toBe(32);
		expect(totals.getCell(COL.absent).value).toBe(18);
		expect(totals.getCell(COL.absentDaily).value).toBe(15);
		expect(totals.getCell(COL.absentWorkshop).value).toBe(3);
		expect(totals.getCell(COL.late).value).toBe(10);
		expect(totals.getCell(9).value).toBe(2);
		expect(totals.getCell(COL.percent).value).toBe(50);
		expect(totals.getCell(COL.percent).numFmt).toBe('0.0"%"');
		expect(totals.getCell(COL.surname).font.bold).toBe(true);
		expect(totals.getCell(COL.surname).border.top?.style).toBe('medium');
		expect(fillColor(sheet, FIRST_DATA_ROW + rows.length, 1)).toBe('FFE7E9ED');
	});

	it('suma solo los desgloses existentes y los deja vacíos si ninguno existe', async () => {
		const partial = await build(fractional);
		const none = await build(
			fractional.map((row) => ({
				...row,
				absentDaily: null,
				absentWorkshop: null,
			})),
		);

		const totalsRow = FIRST_DATA_ROW + fractional.length;
		expect(partial.getCell(totalsRow, COL.absentDaily).value).toBe(10);
		expect(none.getCell(totalsRow, COL.absentDaily).value).toBeNull();
		expect(none.getCell(totalsRow, COL.absentWorkshop).value).toBeNull();
	});

	it('deja vacío el promedio cuando ninguna fila tiene porcentaje', async () => {
		const sheet = await build(
			rows.map((row) => ({ ...row, absencePercent: null })),
		);

		expect(
			sheet.getCell(FIRST_DATA_ROW + rows.length, COL.percent).value,
		).toBeNull();
	});

	it('agrega la leyenda de ponderaciones debajo de los totales', async () => {
		const sheet = await build(rows);

		// Totals row, then one blank spacer row, then the legend.
		const legendRow = FIRST_DATA_ROW + rows.length + 2;
		const first = sheet.getCell(legendRow, 1);
		expect(first.value).toEqual(expect.stringContaining('tarde ¼'));
		expect(first.value).toEqual(expect.stringContaining('taller ½'));
		expect(first.font.italic).toBe(true);
		expect(sheet.getCell(legendRow, 11).master.address).toBe(`A${legendRow}`);
		expect(sheet.getCell(legendRow + 1, 1).value).toEqual(
			expect.stringContaining('clases efectivamente dadas'),
		);
	});

	it('el título combinado no ensancha la columna A', async () => {
		const sheet = await build(
			rows,
			'Un título extremadamente largo que no debería afectar el ancho de columnas',
		);

		expect(sheet.getColumn(1).width).toBeLessThan(30);
	});

	it('genera solo título, encabezado y leyenda sin filas de datos', async () => {
		const sheet = await build([]);

		expect(sheet.getCell(HEADER_ROW, 1).value).toBe('Apellido');
		// No totals row: the row after the header stays blank as the spacer,
		// and the legend starts right after it.
		expect(sheet.getCell(FIRST_DATA_ROW, 1).value).toBeNull();
		expect(sheet.getCell(HEADER_ROW + 2, 1).value).toEqual(
			expect.stringContaining('tarde ¼'),
		);
	});

	it('deja en blanco y sin color un estado desconocido de un reporte guardado', async () => {
		const unknown = {
			...rows[0],
			status: 'archived',
		} as unknown as ExcelRow;
		const sheet = await build([unknown]);

		expect(sheet.getCell(FIRST_DATA_ROW, COL.status).value).toBeNull();
		expect(fillColor(sheet, FIRST_DATA_ROW, COL.status)).toBeUndefined();
		expect(fillColor(sheet, FIRST_DATA_ROW, COL.percent)).toBeUndefined();
		expect(sheet.getCell(FIRST_DATA_ROW, COL.surname).value).toBe('García');
	});
});
