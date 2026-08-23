import { describe, expect, it } from 'vitest';
import {
	REPORT_ALERT_META,
	REPORT_STATUS_META,
	buildTrendChartData,
	getAbsencePercentTone,
	getAttendanceBarTone,
	getStatusTooltip,
	sortPeriodsDesc,
} from './report-format';

describe('REPORT_STATUS_META', () => {
	it('cubre los tres estados del semáforo', () => {
		expect(Object.keys(REPORT_STATUS_META).sort()).toEqual([
			'at-risk',
			'exceeded',
			'ok',
		]);
	});

	it('define etiqueta, descripción y badge para cada estado', () => {
		for (const meta of Object.values(REPORT_STATUS_META)) {
			expect(meta.label.length).toBeGreaterThan(0);
			expect(meta.description.length).toBeGreaterThan(0);
			expect(meta.badgeClass.length).toBeGreaterThan(0);
		}
	});

	it('usa la paleta emerald/amber/rose del sistema', () => {
		expect(REPORT_STATUS_META.ok.badgeClass).toContain('emerald');
		expect(REPORT_STATUS_META['at-risk'].badgeClass).toContain('amber');
		expect(REPORT_STATUS_META.exceeded.badgeClass).toContain('rose');
	});
});

describe('REPORT_ALERT_META', () => {
	it('cubre los tipos de alerta generados por el backend', () => {
		expect(Object.keys(REPORT_ALERT_META)).toEqual(
			expect.arrayContaining(['warning', 'critical', 'exceeded']),
		);
	});

	it('define etiqueta e icono para cada alerta', () => {
		for (const meta of Object.values(REPORT_ALERT_META)) {
			expect(meta.label.length).toBeGreaterThan(0);
			expect(meta.iconClass.length).toBeGreaterThan(0);
		}
	});
});

describe('getAbsencePercentTone', () => {
	it('usa tono ok por debajo del umbral de advertencia', () => {
		expect(getAbsencePercentTone(70)).toBe(getAbsencePercentTone(0));
	});

	it('usa tono warning a partir del umbral de advertencia', () => {
		expect(getAbsencePercentTone(80)).toBe(getAbsencePercentTone(75));
	});

	it('usa tono critical a partir del umbral crítico', () => {
		expect(getAbsencePercentTone(90)).toBe(getAbsencePercentTone(100));
	});
});

describe('getAttendanceBarTone', () => {
	it('corta en los mismos umbrales que el tono de texto', () => {
		const tones = new Set([
			getAttendanceBarTone(70),
			getAttendanceBarTone(80),
			getAttendanceBarTone(90),
		]);
		expect(tones.size).toBe(3);
		expect(getAttendanceBarTone(70)).toBe(getAttendanceBarTone(0));
		expect(getAttendanceBarTone(90)).toBe(getAttendanceBarTone(100));
	});
});

describe('getStatusTooltip', () => {
	it('cita el umbral de advertencia (75%)', () => {
		expect(getStatusTooltip('at-risk')).toContain('75%');
	});

	it('cita el umbral crítico (85%)', () => {
		expect(getStatusTooltip('exceeded')).toContain('85%');
	});

	it('explica el estado ok', () => {
		expect(getStatusTooltip('ok').length).toBeGreaterThan(0);
	});
});

describe('buildTrendChartData', () => {
	it('ordena los meses ascendentemente con etiquetas cortas capitalizadas', () => {
		const months = [
			{ month: 8, year: 2026, averageAttendance: 90 },
			{ month: 3, year: 2025, averageAttendance: 80 },
			{ month: 12, year: 2025, averageAttendance: 85 },
		];

		const points = buildTrendChartData(months);

		expect(points.map((p) => p.label)).toEqual([
			'Mar 2025',
			'Dic 2025',
			'Ago 2026',
		]);
		expect(points.map((p) => p.asistencia)).toEqual([80, 85, 90]);
	});

	it('retorna un array vacío sin datos', () => {
		expect(buildTrendChartData([])).toEqual([]);
	});
});

describe('sortPeriodsDesc', () => {
	it('ordena del período más reciente al más antiguo', () => {
		const periods = [
			{ month: 3, year: 2026 },
			{ month: 11, year: 2025 },
			{ month: 7, year: 2026 },
		];

		expect(sortPeriodsDesc(periods)).toEqual([
			{ month: 7, year: 2026 },
			{ month: 3, year: 2026 },
			{ month: 11, year: 2025 },
		]);
	});
});
