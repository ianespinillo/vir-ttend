import { LEVEL } from '@repo/common';
import { ExportFormatterService } from '../../../src/modules/reporting/domain/services/export-formatter.service';
import { IDetailedStudentReport } from '../../../src/modules/reporting/domain/types/detailed-student-report.type';
import { IMonthlyReportData } from '../../../src/modules/reporting/domain/types/monthly-report-data.type';

const monthly: IMonthlyReportData = {
	courseName: '3° A',
	level: LEVEL.SECONDARY,
	period: { month: 7, year: 2026 },
	workingDays: 22,
	students: [
		{
			studentId: 's1',
			fullName: 'García, Juan',
			documentNumber: '35123456',
			present: 18,
			absent: 12.5,
			late: 2,
			justified: 1,
			daysGiven: 20,
			absenceBreakdown: { daily: 10, workshop: 2.5 },
			absencePercent: 62.5,
			status: 'at-risk',
			alerts: [],
		},
		{
			studentId: 's2',
			fullName: 'Pérez, Ana',
			documentNumber: '40234567',
			present: 10,
			absent: 10.25,
			late: 3,
			justified: 0,
			absencePercent: 51.25,
			status: 'ok',
			alerts: [],
		},
		{
			studentId: 's3',
			fullName: 'López, Carlos',
			documentNumber: '38123456',
			present: 0,
			absent: 10,
			late: 0,
			justified: 0,
			absencePercent: null,
			status: 'ok',
			alerts: [],
		},
	],
	summary: { averageAttendance: 40, studentsAtRisk: 1, studentsExceeded: 0 },
};

const student: IDetailedStudentReport = {
	studentId: 's1',
	fullName: 'García, Juan',
	documentNumber: '35123456',
	courseId: 'c1',
	courseName: '3° A',
	level: LEVEL.SECONDARY,
	academicYearId: 'ay-1',
	months: [
		{
			month: 7,
			year: 2026,
			present: 18,
			absent: 12.5,
			late: 2,
			justified: 1,
			daysGiven: 20,
			absenceBreakdown: { daily: 10, workshop: 2.5 },
			absencePercent: 62.5,
			status: 'at-risk',
		},
		{
			month: 8,
			year: 2026,
			present: 0,
			absent: 0,
			late: 0,
			justified: 0,
			daysGiven: 0,
			absenceBreakdown: { daily: 0, workshop: 0 },
			absencePercent: null,
			status: 'ok',
		},
	],
	totals: {
		present: 18,
		absent: 12.5,
		late: 2,
		justified: 1,
		totalDays: 20,
		absenceBreakdown: { daily: 10, workshop: 2.5 },
		averageAbsencePercent: 62.5,
	},
	status: 'at-risk',
	alerts: [],
};

describe('ExportFormatterService', () => {
	describe('Excel rows', () => {
		it('keeps fractional absence totals as numbers, unrounded', () => {
			const rows = ExportFormatterService.formatForExcel(monthly);

			expect(rows[0].absent).toBe(12.5);
			expect(rows[1].absent).toBe(10.25);
			expect(rows[1].absencePercent).toBe(51.25);
		});

		it('keeps a missing percentage empty', () => {
			expect(
				ExportFormatterService.formatForExcel(monthly)[2].absencePercent,
			).toBeNull();
		});

		it('does the same for the individual report months', () => {
			const rows = ExportFormatterService.formatStudentForExcel(student);

			expect(rows.map((r) => r.absent)).toEqual([12.5, 0]);
			expect(rows[1].absencePercent).toBeNull();
		});
	});

	describe('PDF rows', () => {
		it('prints fractional absence totals with the Spanish decimal comma', () => {
			const [section] = ExportFormatterService.formatForPdf(monthly);

			const absentColumn = section.headers.indexOf('Inas.');
			expect(section.rows.map((row) => row[absentColumn])).toEqual([
				'12,5',
				'10,25',
				'10',
			]);
		});

		it('prints a dash instead of a percentage when no class was given', () => {
			const [section] = ExportFormatterService.formatForPdf(monthly);

			const percentColumn = section.headers.indexOf('%');
			expect(section.rows.map((row) => row[percentColumn])).toEqual([
				'62.50%',
				'51.25%',
				'—',
			]);
		});

		it('prints the course average, or a dash without classes', () => {
			const [withClasses] = ExportFormatterService.formatForPdf(monthly);
			const [withoutClasses] = ExportFormatterService.formatForPdf({
				...monthly,
				summary: { ...monthly.summary, averageAttendance: null },
			});

			expect(withClasses.summary).toContain('Promedio de asistencia: 40.00%');
			expect(withoutClasses.summary).toContain('Promedio de asistencia: —');
		});

		it('prints the individual report months and the totals with their breakdown', () => {
			const [section] = ExportFormatterService.formatStudentForPdf(student);

			expect(section.rows[0]).toEqual([
				'7/2026',
				'18',
				'12,5',
				'2',
				'1',
				'62.50%',
				'En riesgo',
			]);
			expect(section.rows[1][2]).toBe('0');
			expect(section.rows[1][5]).toBe('—');
			expect(section.summary).toContain('Total días: 20');
			expect(section.summary).toContain(
				'Inasistencias: 12,5 (turno 10, taller 2,5)',
			);
			expect(section.summary).toContain('Promedio de ausencia: 62.50%');
		});
	});
});
