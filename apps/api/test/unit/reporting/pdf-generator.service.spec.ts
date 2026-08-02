import { PdfMetadata } from '../../../src/modules/reporting/domain/types/pdf-metadata.type';
import { PdfSection } from '../../../src/modules/reporting/domain/types/pdf-section.type';
import { PdfGeneratorService } from '../../../src/modules/reporting/infrastructure/services/pdf-generator.service';

const metadata: PdfMetadata = {
	schoolName: 'Escuela Secundaria N° 12',
	periodLabel: '7/2026',
	generatedAt: new Date('2026-07-15T10:00:00.000Z').toISOString(),
};

const section: PdfSection = {
	title: 'Reporte de Asistencia - 3° A - 7/2026',
	headers: [
		'Apellido',
		'Nombre',
		'Documento',
		'P',
		'A',
		'T',
		'J',
		'%',
		'Estado',
	],
	rows: [
		['García', 'Juan', '35123456', '18', '1', '2', '1', '10%', 'OK'],
		['Pérez', 'Ana', '40234567', '10', '5', '3', '1', '55%', 'En riesgo'],
	],
	summary: [
		'Promedio de asistencia: 90%',
		'Estudiantes en riesgo: 1',
		'Estudiantes con ausencia excedida: 0',
	],
};

describe('PdfGeneratorService', () => {
	let service: PdfGeneratorService;

	beforeEach(() => {
		service = new PdfGeneratorService();
	});

	it('devuelve un buffer PDF válido', async () => {
		const buffer = await service.generate([section], metadata);

		expect(Buffer.isBuffer(buffer)).toBe(true);
		expect(buffer.length).toBeGreaterThan(0);
		expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
	});

	it('acepta múltiples secciones y genera un PDF no vacío', async () => {
		const buffer = await service.generate([section, section], metadata);

		expect(buffer.length).toBeGreaterThan(0);
		expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
	});

	it('genera un PDF válido con muchas filas (salto de página)', async () => {
		const manyRows = Array.from({ length: 100 }, (_, i) => [
			`Alumno${i + 1}`,
			'Nombre',
			'12345678',
			'20',
			'0',
			'0',
			'0',
			'0%',
			'OK',
		]);
		const buffer = await service.generate(
			[{ ...section, rows: manyRows }],
			metadata,
		);

		expect(buffer.length).toBeGreaterThan(0);
		expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
	});

	it('trunca texto largo en celdas sin lanzar error', async () => {
		const longText =
			'Este es un nombre extremadamente largo que excede el ancho'.repeat(5);
		const buffer = await service.generate(
			[
				{
					...section,
					rows: [[longText, 'Nombre', '12345678', '20', '0', '0', '0', '0%', 'OK']],
				},
			],
			metadata,
		);

		expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
	});
});
