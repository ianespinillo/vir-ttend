import { Injectable } from '@nestjs/common';
import { Workbook, Worksheet } from 'exceljs';
import { IExcelGeneratorService } from '../../domain/ports/excel-generator.port.interface';
import { ExcelRow } from '../../domain/types/excel-row.type';
import { ReportStudentStatus } from '../../domain/types/student-report-entry.type';

const HEADER_FILL = {
	type: 'pattern',
	pattern: 'solid',
	bgColor: { argb: 'FF1F4E78' },
	fgColor: { argb: 'FF1F4E78' },
} as const;

const LOW_ABSENCE_FILL = {
	type: 'pattern',
	pattern: 'solid',
	bgColor: { argb: 'FFC6EFCE' },
	fgColor: { argb: 'FFC6EFCE' },
} as const;

const MEDIUM_ABSENCE_FILL = {
	type: 'pattern',
	pattern: 'solid',
	bgColor: { argb: 'FFFFEB9C' },
	fgColor: { argb: 'FFFFEB9C' },
} as const;

const HIGH_ABSENCE_FILL = {
	type: 'pattern',
	pattern: 'solid',
	bgColor: { argb: 'FFFFC7CE' },
	fgColor: { argb: 'FFFFC7CE' },
} as const;

@Injectable()
export class ExcelGeneratorService implements IExcelGeneratorService {
	async generate(rows: ExcelRow[], title: string): Promise<Buffer> {
		const workbook = new Workbook();
		workbook.title = title;
		const sheet = workbook.addWorksheet('Reporte');

		sheet.columns = [
			{ header: 'Apellido', key: 'surname', width: 20 },
			{ header: 'Nombre', key: 'name', width: 18 },
			{ header: 'Documento', key: 'documentNumber', width: 12 },
			{ header: 'Presentes', key: 'present', width: 10 },
			{ header: 'Inasistencias', key: 'absent', width: 13 },
			{ header: 'Tardanzas', key: 'late', width: 10 },
			{ header: 'Justificados', key: 'justified', width: 12 },
			{ header: '%', key: 'absencePercent', width: 8 },
			{ header: 'Estado', key: 'status', width: 12 },
		];

		rows.forEach((row) =>
			sheet.addRow({
				...row,
				status: this.statusLabel(row.status),
			}),
		);

		const headerRow = sheet.getRow(1);
		headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
		headerRow.fill = HEADER_FILL;
		headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

		if (rows.length > 0) {
			this.applyConditionalFormatting(sheet, rows.length + 1);
			this.addTotalsRow(sheet, rows);
		}

		this.autoFitColumns(sheet);

		return workbook.xlsx.writeBuffer() as unknown as Promise<Buffer>;
	}

	private applyConditionalFormatting(
		sheet: Worksheet,
		lastDataRow: number,
	): void {
		sheet.addConditionalFormatting({
			ref: `H2:H${lastDataRow}`,
			// ISNUMBER keeps the empty percentage of a student with no class given
			// uncolored (a blank cell would otherwise count as 0).
			rules: [
				{
					type: 'expression',
					formulae: ['AND(ISNUMBER(H2),H2<50)'],
					priority: 1,
					style: { fill: LOW_ABSENCE_FILL },
				},
				{
					type: 'expression',
					formulae: ['AND(ISNUMBER(H2),H2>=50,H2<75)'],
					priority: 2,
					style: { fill: MEDIUM_ABSENCE_FILL },
				},
				{
					type: 'expression',
					formulae: ['AND(ISNUMBER(H2),H2>=75)'],
					priority: 3,
					style: { fill: HIGH_ABSENCE_FILL },
				},
			],
		});
	}

	private addTotalsRow(sheet: Worksheet, rows: ExcelRow[]): void {
		const totalsRow = sheet.addRow({
			surname: 'Total',
			name: '',
			documentNumber: '',
			present: rows.reduce((sum, row) => sum + row.present, 0),
			absent: rows.reduce((sum, row) => sum + row.absent, 0),
			late: rows.reduce((sum, row) => sum + row.late, 0),
			justified: rows.reduce((sum, row) => sum + row.justified, 0),
			absencePercent: this.averagePercent(rows),
			status: '',
		});
		totalsRow.font = { bold: true };
		totalsRow.getCell('absencePercent').numFmt = '0.0';
		totalsRow.eachCell((cell) => {
			cell.border = { top: { style: 'thin' } };
		});
	}

	/** Mean of the percentages that exist; null when no row has one. */
	private averagePercent(rows: ExcelRow[]): number | null {
		const percents = rows
			.map((row) => row.absencePercent)
			.filter((percent): percent is number => percent !== null);
		if (percents.length === 0) return null;
		const mean =
			percents.reduce((sum, percent) => sum + percent, 0) / percents.length;
		return Math.round(mean * 10) / 10;
	}

	private autoFitColumns(sheet: Worksheet): void {
		sheet.columns.forEach((col) => {
			if (!col) return;
			let maxLength = String(col.header ?? '').length;
			col.eachCell?.((cell) => {
				maxLength = Math.max(maxLength, String(cell.value ?? '').length);
			});
			col.width = Math.max(col.width ?? 10, maxLength + 2);
		});
	}

	private statusLabel(status: ReportStudentStatus): string {
		switch (status) {
			case 'ok':
				return 'OK';
			case 'at-risk':
				return 'En riesgo';
			case 'exceeded':
				return 'Excedido';
		}
	}
}
