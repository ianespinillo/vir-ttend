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
	'Ausentes',
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
	'A',
	'T',
	'J',
	'%',
	'Estado',
];

const PDF_STUDENT_HEADERS = ['Mes', 'P', 'A', 'T', 'J', '%', 'Estado'];

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
				String(s.absent),
				String(s.late),
				String(s.justified),
				`${s.absencePercent}%`,
				ExportFormatterService.statusLabel(s.status),
			];
		});

		return [
			{
				title: `Reporte de Asistencia - ${report.courseName} - ${periodLabel}`,
				headers: PDF_HEADERS,
				rows,
				summary: [
					`Promedio de asistencia: ${report.summary.averageAttendance}%`,
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
			String(m.absent),
			String(m.late),
			String(m.justified),
			`${m.absencePercent}%`,
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
					`Promedio de ausencia: ${report.totals.averageAbsencePercent}%`,
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
