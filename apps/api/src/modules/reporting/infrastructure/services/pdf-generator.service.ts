import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import { IPdfGeneratorService } from '../../domain/ports/pdf-generator.port.interface';
import { PdfMetadata } from '../../domain/types/pdf-metadata.type';
import { PdfSection } from '../../domain/types/pdf-section.type';

const PAGE_MARGIN = 40;
const ROW_HEIGHT = 20;
const FONT = 'Helvetica';
const FONT_BOLD = 'Helvetica-Bold';
const BLUE = '#1F4E78';
const LIGHT_ROW = '#FFFFFF';
const DARK_ROW = '#F5F5F5';
const GRID = '#CCCCCC';

@Injectable()
export class PdfGeneratorService implements IPdfGeneratorService {
	generate(sections: PdfSection[], metadata: PdfMetadata): Promise<Buffer> {
		return new Promise((resolve) => {
			const doc = new PDFDocument({ size: 'A4', margin: PAGE_MARGIN });
			const chunks: Buffer[] = [];
			doc.on('data', (chunk: Buffer) => chunks.push(chunk));
			doc.on('end', () => resolve(Buffer.concat(chunks)));

			this.renderHeader(doc, metadata);
			sections.forEach((section) => this.renderSection(doc, section));
			this.renderFooter(doc, metadata);

			doc.end();
		});
	}

	private renderHeader(doc: PDFKit.PDFDocument, metadata: PdfMetadata): void {
		const x = doc.page.margins.left;
		const y = doc.y;
		const initial = (metadata.schoolName.trim()[0] ?? 'E').toUpperCase();

		doc.save();
		doc.roundedRect(x, y, 40, 40, 8).fill(BLUE);
		doc.restore();

		doc
			.fillColor('#FFFFFF')
			.font(FONT_BOLD)
			.fontSize(20)
			.text(initial, x + 8, y + 8, {
				width: 24,
				align: 'center',
				lineBreak: false,
			});

		doc
			.fillColor('#000000')
			.font(FONT_BOLD)
			.fontSize(16)
			.text(metadata.schoolName, x + 52, y, {
				width: doc.page.width - x - 52 - PAGE_MARGIN,
				lineBreak: false,
			});

		doc
			.font(FONT)
			.fontSize(10)
			.fillColor('#666666')
			.text(`Período: ${metadata.periodLabel}`, x + 52, y + 22, {
				width: doc.page.width - x - 52 - PAGE_MARGIN,
				lineBreak: false,
			});

		doc.moveDown(2);
	}

	private renderSection(doc: PDFKit.PDFDocument, section: PdfSection): void {
		this.renderSectionTitle(doc, section.title);
		if (section.rows.length > 0)
			this.renderTable(doc, section.headers, section.rows);
		this.renderSummary(doc, section.summary);
	}

	private renderSectionTitle(doc: PDFKit.PDFDocument, title: string): void {
		doc.font(FONT_BOLD).fontSize(12).fillColor(BLUE).text(title);
		doc.moveDown(0.5);
	}

	private renderTable(
		doc: PDFKit.PDFDocument,
		headers: string[],
		rows: string[][],
	): void {
		const colWidths = this.calculateColWidths(doc, headers, rows);
		this.renderHeaderRow(doc, headers, colWidths);
		rows.forEach((row, index) =>
			this.renderRow(doc, headers, row, colWidths, index % 2 === 1),
		);
		doc.moveDown(0.5);
	}

	private calculateColWidths(
		doc: PDFKit.PDFDocument,
		headers: string[],
		rows: string[][],
	): number[] {
		const usable =
			doc.page.width - doc.page.margins.left - doc.page.margins.right;
		const lengths = headers.map((header, index) =>
			Math.max(
				header.length,
				...rows.map((row) => String(row[index] ?? '').length),
				4,
			),
		);
		const total = lengths.reduce((sum, length) => sum + length, 0);
		return lengths.map((length) => Math.max(30, (length / total) * usable));
	}

	private renderHeaderRow(
		doc: PDFKit.PDFDocument,
		headers: string[],
		colWidths: number[],
	): void {
		this.ensureSpace(doc);
		const y = doc.y;
		let x = doc.page.margins.left;

		doc.font(FONT_BOLD).fontSize(9).fillColor('#FFFFFF');
		headers.forEach((header, index) => {
			this.fillCell(doc, x, y, colWidths[index], BLUE);
			doc.text(this.truncate(doc, header, colWidths[index] - 8), x + 3, y + 6, {
				width: colWidths[index] - 6,
				lineBreak: false,
			});
			x += colWidths[index];
		});

		doc.y = y + ROW_HEIGHT;
		doc.fillColor('#000000');
	}

	private renderRow(
		doc: PDFKit.PDFDocument,
		headers: string[],
		row: string[],
		colWidths: number[],
		dark: boolean,
	): void {
		if (doc.y + ROW_HEIGHT > doc.page.height - PAGE_MARGIN) {
			doc.addPage();
			this.renderHeaderRow(doc, headers, colWidths);
		}
		const y = doc.y;
		let x = doc.page.margins.left;

		doc.font(FONT).fontSize(9).fillColor('#000000');
		row.forEach((cell, index) => {
			this.fillCell(doc, x, y, colWidths[index], dark ? DARK_ROW : LIGHT_ROW);
			doc.text(
				this.truncate(doc, String(cell ?? ''), colWidths[index] - 8),
				x + 3,
				y + 6,
				{
					width: colWidths[index] - 6,
					lineBreak: false,
				},
			);
			x += colWidths[index];
		});

		doc.y = y + ROW_HEIGHT;
	}

	private fillCell(
		doc: PDFKit.PDFDocument,
		x: number,
		y: number,
		width: number,
		color: string,
	): void {
		doc.save();
		doc.rect(x, y, width, ROW_HEIGHT).fillAndStroke(color, GRID);
		doc.restore();
	}

	private renderSummary(doc: PDFKit.PDFDocument, summary: string[]): void {
		if (summary.length === 0) return;
		doc.moveDown(0.5);
		doc.font(FONT_BOLD).fontSize(10).fillColor(BLUE).text('Resumen');
		doc.font(FONT).fontSize(9).fillColor('#000000');
		summary.forEach((line) => doc.text(`• ${line}`, doc.page.margins.left + 6));
		doc.moveDown();
	}

	private renderFooter(doc: PDFKit.PDFDocument, metadata: PdfMetadata): void {
		const range = doc.bufferedPageRange();
		for (let i = range.start; i < range.start + range.count; i++) {
			doc.switchToPage(i);
			const footerY = doc.page.height - 30;
			doc.save();
			doc.font(FONT).fontSize(8).fillColor('#999999');
			doc.text(
				`Generado el ${this.formatDate(metadata.generatedAt)}`,
				doc.page.margins.left,
				footerY,
				{ lineBreak: false },
			);
			doc.text(
				`Página ${i - range.start + 1} de ${range.count}`,
				doc.page.margins.left,
				footerY,
				{
					width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
					align: 'right',
					lineBreak: false,
				},
			);
			doc.restore();
		}
	}

	private ensureSpace(doc: PDFKit.PDFDocument): void {
		if (doc.y + ROW_HEIGHT > doc.page.height - PAGE_MARGIN) doc.addPage();
	}

	private truncate(
		doc: PDFKit.PDFDocument,
		text: string,
		maxWidth: number,
	): string {
		if (doc.widthOfString(text) <= maxWidth) return text;
		let result = text;
		while (result.length > 0 && doc.widthOfString(`${result}...`) > maxWidth) {
			result = result.slice(0, -1);
		}
		return `${result}...`;
	}

	private formatDate(iso: string): string {
		const date = new Date(iso);
		return date.toLocaleDateString('es-AR', {
			day: 'numeric',
			month: 'long',
			year: 'numeric',
		});
	}
}
