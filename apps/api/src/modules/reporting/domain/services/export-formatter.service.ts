import { formatCount } from '@repo/common';
import { IDetailedStudentReport } from '../types/detailed-student-report.type';
import { ExcelRow } from '../types/excel-row.type';
import { IMonthlyReportData } from '../types/monthly-report-data.type';
import { PdfSection } from '../types/pdf-section.type';
import { ReportStudentStatus } from '../types/student-report-entry.type';

const EXCEL_HEADERS = [
	'Apellido',
	'Nombre',
	'Documento',
	'Presentes',
	'Inasistencias',
	'Tardanzas',
	'Justificados',
	'%',
	'Estado',
];

const PDF_HEADERS = [
	'Apellido',
	'Nombre',
	'Documento',
	'P',
	'Inas.',
	'T',
	'J',
	'%',
	'Estado',
];

const PDF_STUDENT_HEADERS = ['Mes', 'P', 'Inas.', 'T', 'J', '%', 'Estado'];

const NO_PERCENT = '—';

/** Display only: the percentage itself stays unrounded. Null means no class given. */
function percentLabel(percent: number | null): string {
	return percent === null ? NO_PERCENT : `${percent.toFixed(2)}%`;
}

export class ExportFormatterService {
	static formatForExcel(report: IMonthlyReportData): ExcelRow[] {
		return report.students.map((s) => {
			const [surname = '', name = ''] = s.fullName.split(', ');
			return {
				surname: surname || s.fullName,
				name: name || '',
				documentNumber: s.documentNumber,
				present: s.present,
				absent: s.absent,
				absentDaily: s.absenceBreakdown?.daily ?? null,
				absentWorkshop: s.absenceBreakdown?.workshop ?? null,
				late: s.late,
				justified: s.justified,
				absencePercent: s.absencePercent,
				status: s.status,
			};
		});
	}
	static formatStudentForExcel(report: IDetailedStudentReport): ExcelRow[] {
		return report.months.map((s) => {
			const [surname = '', name = ''] = report.fullName.split(', ');
			return {
				surname: surname || report.fullName,
				name: name || '',
				documentNumber: report.documentNumber,
				present: s.present,
				absent: s.absent,
				absentDaily: s.absenceBreakdown?.daily ?? null,
				absentWorkshop: s.absenceBreakdown?.workshop ?? null,
				late: s.late,
				justified: s.justified,
				absencePercent: s.absencePercent,
				status: s.status,
			};
		});
	}

	static formatForPdf(report: IMonthlyReportData): PdfSection[] {
		const periodLabel = `${report.period.month}/${report.period.year}`;

		const rows = report.students.map((s) => {
			const [surname = '', name = ''] = s.fullName.split(', ');
			return [
				surname || s.fullName,
				name || '',
				s.documentNumber,
				String(s.present),
				formatCount(s.absent),
				String(s.late),
				String(s.justified),
				percentLabel(s.absencePercent),
				ExportFormatterService.statusLabel(s.status),
			];
		});

		return [
			{
				title: `Reporte de Asistencia - ${report.courseName} - ${periodLabel}`,
				headers: PDF_HEADERS,
				rows,
				summary: [
					`Promedio de asistencia: ${percentLabel(report.summary.averageAttendance)}`,
					'Inasistencias: total ponderado por día (turno y taller), con tope de 1 por día',
					`Estudiantes en riesgo: ${report.summary.studentsAtRisk}`,
					`Estudiantes con ausencia excedida: ${report.summary.studentsExceeded}`,
				],
			},
		];
	}

	static formatStudentForPdf(report: IDetailedStudentReport): PdfSection[] {
		const rows = report.months.map((m) => [
			`${m.month}/${m.year}`,
			String(m.present),
			formatCount(m.absent),
			String(m.late),
			String(m.justified),
			percentLabel(m.absencePercent),
			ExportFormatterService.statusLabel(m.status),
		]);

		return [
			{
				title: `Reporte Individual - ${report.fullName} - ${report.courseName}`,
				headers: PDF_STUDENT_HEADERS,
				rows,
				summary: [
					`Documento: ${report.documentNumber}`,
					`Nivel: ${report.level}`,
					`Total días: ${report.totals.totalDays}`,
					`Inasistencias: ${formatCount(report.totals.absent)} (turno ${formatCount(report.totals.absenceBreakdown.daily)}, taller ${formatCount(report.totals.absenceBreakdown.workshop)})`,
					`Promedio de ausencia: ${percentLabel(report.totals.averageAbsencePercent)}`,
					`Estado: ${ExportFormatterService.statusLabel(report.status)}`,
				],
			},
		];
	}

	private static statusLabel(status: ReportStudentStatus): string {
		return status === 'ok'
			? 'OK'
			: status === 'at-risk'
				? 'En riesgo'
				: 'Excedido';
	}
}
