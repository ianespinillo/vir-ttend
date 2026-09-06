import { describe, expect, it } from 'vitest';
import {
	formatDate,
	formatFullName,
	formatMonthLabel,
	formatPercent,
} from './format';

describe('format', () => {
	it('formatea fechas con el patrón por defecto dd/MM/yyyy', () => {
		expect(formatDate(new Date(2026, 7, 5))).toBe('05/08/2026');
	});

	it('acepta un patrón custom', () => {
		expect(formatDate(new Date(2026, 7, 5), 'yyyy-MM-dd')).toBe('2026-08-05');
	});

	it('formatea porcentajes con un decimal por defecto', () => {
		expect(formatPercent(13.333)).toBe('13.3%');
		expect(formatPercent(85, 0)).toBe('85%');
	});

	it('arma el nombre completo con y sin apellido', () => {
		expect(formatFullName('María', 'González')).toBe('María González');
		expect(formatFullName('María')).toBe('María');
	});

	it('etiqueta meses en español capitalizado', () => {
		expect(formatMonthLabel(3)).toBe('Marzo');
	});

	it('acepta el estilo corto', () => {
		expect(formatMonthLabel(3, 'short')).toBe('Mar');
	});
});
