import { Injectable } from '@nestjs/common';
import { Fill, Workbook, Worksheet } from 'exceljs';
import { IExcelGeneratorService } from '../../domain/ports/excel-generator.port.interface';
import { ExcelRow } from '../../domain/types/excel-row.type';
import { ReportStudentStatus } from '../../domain/types/student-report-entry.type';

const solidFill = (argb: string): Fill => ({
	type: 'pattern',
	pattern: 'solid',
	bgColor: { argb },
	fgColor: { argb },
});

const HEADER_FILL = solidFill('FF1F4E78');
const ZEBRA_FILL = solidFill('FFF5F7FA');
const TOTALS_FILL = solidFill('FFE7E9ED');

type StatusStyle = { label: string; fill: Fill; textColor: string };

/** Soft fill + dark text per student status; also used to tint the percent. */
const STATUS_STYLES: Record<ReportStudentStatus, StatusStyle> = {
	ok: { label: 'OK', fill: solidFill('FFC6EFCE'), textColor: 'FF006100' },
	'at-risk': {
		label: 'En riesgo',
		fill: solidFill('FFFFEB9C'),
		textColor: 'FF9C5700',
	},
	exceeded: {
		label: 'Excedido',
		fill: solidFill('FFFFC7CE'),
		textColor: 'FF9C0006',
	},
};

const BORDER_COLOR = { argb: 'FFD0D4DA' };
const THIN_BORDER = {
	top: { style: 'thin', color: BORDER_COLOR },
	left: { style: 'thin', color: BORDER_COLOR },
	bottom: { style: 'thin', color: BORDER_COLOR },
	right: { style: 'thin', color: BORDER_COLOR },
} as const;

/**
 * Percentages are stored as 0-100 (same scale as the totals mean) and shown
 * with one decimal and a literal percent sign. Counts keep the `General`
 * format: it renders 10 as "10", 12.5 as "12,5" and 10.25 as "10,25" (the
 * decimal separator follows the viewer's locale) and never leaves a dangling
 * separator, which `0.##` does for integers.
 */
const PERCENT_FORMAT = '0.0"%"';

const SHEET_NAME = 'Asistencia';
const TITLE_ROW = 1;
const SUBTITLE_ROW = 2;
const HEADER_ROW = 4;
const FIRST_DATA_ROW = HEADER_ROW + 1;
const FROZEN_NAME_COLUMNS = 2;

const COLUMNS = [
	{ header: 'Apellido', key: 'surname', width: 20, align: 'left' },
	{ header: 'Nombre', key: 'name', width: 18, align: 'left' },
	{ header: 'Documento', key: 'documentNumber', width: 12, align: 'center' },
	{ header: 'Presentes', key: 'present', width: 10, align: 'center' },
	{ header: 'Inasistencias', key: 'absent', width: 13, align: 'center' },
	{ header: 'Inas. teóricas', key: 'absentDaily', width: 12, align: 'center' },
	{ header: 'Inas. taller', key: 'absentWorkshop', width: 12, align: 'center' },
	{ header: 'Tardanzas', key: 'late', width: 10, align: 'center' },
	{ header: 'Justificados', key: 'justified', width: 12, align: 'center' },
	{ header: '% Inasist.', key: 'absencePercent', width: 11, align: 'center' },
	{ header: 'Estado', key: 'status', width: 12, align: 'center' },
] as const;

type ColumnKey = (typeof COLUMNS)[number]['key'];
type CellValue = string | number | null;

const LEGEND_LINES = [
	'Inasistencias ponderadas: falta 1 (½ si el día tuvo taller); falta a taller ½; tarde ¼; tarde fuera de tolerancia ½.',
	'El % Inasist. se calcula sobre las clases efectivamente dadas.',
];

@Injectable()
export class ExcelGeneratorService implements IExcelGeneratorService {
	async generate(rows: ExcelRow[], title: string): Promise<Buffer> {
		const workbook = new Workbook();
		workbook.title = title;
		const sheet = workbook.addWorksheet(SHEET_NAME);
		const lastColumn = COLUMNS.length;

		sheet.columns = COLUMNS.map(({ key, width }) => ({ key, width }));

		this.addTitleBlock(sheet, title, lastColumn);
		this.addHeaderRow(sheet);
		rows.forEach((row, index) => this.addDataRow(sheet, row, index));

		let lastTableRow = HEADER_ROW + rows.length;
		if (rows.length > 0) {
			lastTableRow += 1;
			this.addTotalsRow(sheet, rows, lastTableRow);
		}
		this.addLegend(sheet, lastTableRow + 2, lastColumn);

		this.autoFitColumns(sheet, lastTableRow);
		this.configureSheet(sheet, lastColumn);

		return workbook.xlsx.writeBuffer() as unknown as Promise<Buffer>;
	}

	private addTitleBlock(
		sheet: Worksheet,
		title: string,
		lastColumn: number,
	): void {
		sheet.mergeCells(TITLE_ROW, 1, TITLE_ROW, lastColumn);
		const titleCell = sheet.getCell(TITLE_ROW, 1);
		titleCell.value = title;
		titleCell.font = { bold: true, size: 16, color: { argb: 'FF1F4E78' } };
		titleCell.alignment = { vertical: 'middle', horizontal: 'left' };
		sheet.getRow(TITLE_ROW).height = 26;

		sheet.mergeCells(SUBTITLE_ROW, 1, SUBTITLE_ROW, lastColumn);
		const subtitleCell = sheet.getCell(SUBTITLE_ROW, 1);
		subtitleCell.value = `Generado el ${this.formatDate(new Date())}`;
		subtitleCell.font = { size: 10, color: { argb: 'FF666666' } };
		subtitleCell.alignment = { vertical: 'middle', horizontal: 'left' };
	}

	private addHeaderRow(sheet: Worksheet): void {
		const headerRow = sheet.getRow(HEADER_ROW);
		headerRow.height = 32;
		COLUMNS.forEach((column, index) => {
			const cell = headerRow.getCell(index + 1);
			cell.value = column.header;
			cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
			cell.fill = HEADER_FILL;
			cell.border = THIN_BORDER;
			cell.alignment = {
				vertical: 'middle',
				horizontal: column.align === 'left' ? 'left' : 'center',
				wrapText: true,
			};
		});
	}

	private addDataRow(sheet: Worksheet, data: ExcelRow, index: number): void {
		// Stored reports are jsonb, so a status outside the union can reach here;
		// it renders blank and untinted instead of failing the whole export.
		const style: StatusStyle | undefined = STATUS_STYLES[data.status];
		const row = sheet.getRow(FIRST_DATA_ROW + index);
		const values: Record<ColumnKey, CellValue> = {
			...data,
			status: style?.label ?? null,
		};

		COLUMNS.forEach((column, columnIndex) => {
			const cell = row.getCell(columnIndex + 1);
			cell.value = values[column.key];
			cell.border = THIN_BORDER;
			cell.alignment = { vertical: 'middle', horizontal: column.align };
			if (index % 2 === 1) cell.fill = ZEBRA_FILL;
		});

		const percentCell = row.getCell('absencePercent');
		percentCell.numFmt = PERCENT_FORMAT;
		if (!style) return;

		// The tint mirrors the "Estado" column; an empty percent stays uncolored.
		if (data.absencePercent !== null) {
			percentCell.fill = style.fill;
			percentCell.font = { color: { argb: style.textColor } };
		}

		const statusCell = row.getCell('status');
		statusCell.fill = style.fill;
		statusCell.font = { bold: true, color: { argb: style.textColor } };
	}

	private addTotalsRow(
		sheet: Worksheet,
		rows: ExcelRow[],
		rowNumber: number,
	): void {
		const totalsRow = sheet.getRow(rowNumber);
		const values: Record<ColumnKey, CellValue> = {
			surname: 'Total',
			name: null,
			documentNumber: null,
			present: this.sum(rows.map((row) => row.present)),
			absent: this.sum(rows.map((row) => row.absent)),
			absentDaily: this.sumOptional(rows.map((row) => row.absentDaily)),
			absentWorkshop: this.sumOptional(rows.map((row) => row.absentWorkshop)),
			late: this.sum(rows.map((row) => row.late)),
			justified: this.sum(rows.map((row) => row.justified)),
			absencePercent: this.averagePercent(rows),
			status: null,
		};

		COLUMNS.forEach((column, index) => {
			const cell = totalsRow.getCell(index + 1);
			cell.value = values[column.key];
			cell.font = { bold: true };
			cell.fill = TOTALS_FILL;
			cell.border = {
				...THIN_BORDER,
				top: { style: 'medium', color: { argb: 'FF1F4E78' } },
			};
			cell.alignment = { vertical: 'middle', horizontal: column.align };
		});
		totalsRow.getCell('absencePercent').numFmt = PERCENT_FORMAT;
	}

	private addLegend(
		sheet: Worksheet,
		firstRow: number,
		lastColumn: number,
	): void {
		LEGEND_LINES.forEach((line, index) => {
			const rowNumber = firstRow + index;
			sheet.mergeCells(rowNumber, 1, rowNumber, lastColumn);
			const cell = sheet.getCell(rowNumber, 1);
			cell.value = line;
			cell.font = { italic: true, size: 9, color: { argb: 'FF808080' } };
			cell.alignment = { vertical: 'middle', horizontal: 'left' };
		});
	}

	private configureSheet(sheet: Worksheet, lastColumn: number): void {
		sheet.views = [
			{
				state: 'frozen',
				xSplit: FROZEN_NAME_COLUMNS,
				ySplit: HEADER_ROW,
				topLeftCell: sheet.getCell(FIRST_DATA_ROW, FROZEN_NAME_COLUMNS + 1).address,
			},
		];
		sheet.autoFilter = {
			from: { row: HEADER_ROW, column: 1 },
			to: { row: HEADER_ROW, column: lastColumn },
		};
		sheet.pageSetup = {
			orientation: 'landscape',
			fitToPage: true,
			fitToWidth: 1,
			fitToHeight: 0,
			printTitlesRow: `${HEADER_ROW}:${HEADER_ROW}`,
		};
	}

	private sum(values: number[]): number {
		return values.reduce((total, value) => total + value, 0);
	}

	/** Sum of the values that exist; null when none does (old stored reports). */
	private sumOptional(values: (number | null)[]): number | null {
		const present = values.filter((value): value is number => value !== null);
		return present.length === 0 ? null : this.sum(present);
	}

	/** Mean of the percentages that exist; null when no row has one. */
	private averagePercent(rows: ExcelRow[]): number | null {
		const percents = rows
			.map((row) => row.absencePercent)
			.filter((percent): percent is number => percent !== null);
		if (percents.length === 0) return null;
		const mean = this.sum(percents) / percents.length;
		return Math.round(mean * 10) / 10;
	}

	/** Fits the table body only: the merged title and legend never count. */
	private autoFitColumns(sheet: Worksheet, lastTableRow: number): void {
		COLUMNS.forEach((column, index) => {
			let maxLength = 0;
			for (
				let rowNumber = FIRST_DATA_ROW;
				rowNumber <= lastTableRow;
				rowNumber++
			) {
				const value = sheet.getCell(rowNumber, index + 1).value;
				maxLength = Math.max(maxLength, String(value ?? '').length);
			}
			// Headers wrap, so they only need to fit their longest word.
			const longestWord = Math.max(
				...column.header.split(' ').map((word) => word.length),
			);
			const fitted = Math.max(longestWord, maxLength) + 2;
			sheet.getColumn(index + 1).width = Math.max(column.width, fitted);
		});
	}

	private formatDate(date: Date): string {
		return date.toLocaleDateString('es-AR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			timeZone: 'America/Argentina/Buenos_Aires',
		});
	}
}
