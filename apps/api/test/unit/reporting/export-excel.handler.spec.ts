import { NotFoundException } from '@nestjs/common';
import { LEVEL } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { ExportExcelCommand } from '../../../src/modules/reporting/application/commands/export-excel/export-excel.command';
import { ExportExcelHandler } from '../../../src/modules/reporting/application/commands/export-excel/export-excel.handler';
import { ReportGenerationService } from '../../../src/modules/reporting/application/services/report-generation.service';
import { Course } from '../../../src/modules/reporting/domain/entities/course.entity';
import { ICoursePort } from '../../../src/modules/reporting/domain/ports/course.port.interface';
import { IExcelGeneratorService } from '../../../src/modules/reporting/domain/ports/excel-generator.port.interface';
import { IDetailedStudentReport } from '../../../src/modules/reporting/domain/types/detailed-student-report.type';
import { MonthlyReportData } from '../../../src/modules/reporting/domain/value-objects/monthly-report-data.vo';

const course = Course.reconstitute({
	id: 'course-1',
	name: '3° A',
	level: LEVEL.PRIMARY,
	academicYearId: 'ay-1',
	tenantId: 'tenant-1',
});

const dummyData = MonthlyReportData.fromData({
	courseName: '3° A',
	level: LEVEL.PRIMARY,
	period: { month: 7, year: 2026 },
	workingDays: 22,
	students: [],
	summary: { averageAttendance: 0, studentsAtRisk: 0, studentsExceeded: 0 },
});

const detailedReport: IDetailedStudentReport = {
	studentId: 'student-1',
	fullName: 'García, Juan',
	documentNumber: '35123456',
	courseId: 'course-1',
	courseName: '3° A',
	level: LEVEL.PRIMARY,
	academicYearId: 'ay-1',
	months: [],
	totals: {
		present: 0,
		absent: 0,
		late: 0,
		justified: 0,
		totalDays: 0,
		averageAbsencePercent: 0,
	},
	status: 'ok',
	alerts: [],
};

describe('ExportExcelHandler', () => {
	let handler: ExportExcelHandler;
	let reporter: MockProxy<ReportGenerationService>;
	let generator: MockProxy<IExcelGeneratorService>;
	let coursePort: MockProxy<ICoursePort>;

	beforeEach(() => {
		reporter = mock<ReportGenerationService>();
		generator = mock<IExcelGeneratorService>();
		coursePort = mock<ICoursePort>();

		coursePort.findById.mockResolvedValue(course);
		generator.generate.mockResolvedValue(Buffer.from('xlsx-buffer'));

		handler = new ExportExcelHandler(reporter, generator, coursePort);
	});

	it('genera el Excel del reporte mensual', async () => {
		reporter.generateMonthlyReport.mockResolvedValue(dummyData);

		const result = await handler.execute(
			new ExportExcelCommand('course-1', 7, 2026, 'monthly'),
		);

		expect(result).toEqual(Buffer.from('xlsx-buffer'));
		expect(reporter.generateMonthlyReport).toHaveBeenCalledWith(
			'course-1',
			expect.objectContaining({ month: 7, year: 2026 }),
		);
		expect(generator.generate).toHaveBeenCalledWith(
			expect.any(Array),
			expect.any(String),
		);
	});

	it('exporta el reporte individual de un estudiante', async () => {
		reporter.generateDetailedStudentReport.mockResolvedValue(detailedReport);

		const result = await handler.execute(
			new ExportExcelCommand('course-1', 7, 2026, 'student', 'student-1'),
		);

		expect(result).toEqual(Buffer.from('xlsx-buffer'));
		expect(reporter.generateDetailedStudentReport).toHaveBeenCalledWith(
			'student-1',
			'ay-1',
		);
		expect(reporter.generateMonthlyReport).not.toHaveBeenCalled();
	});

	it('lanza NotFoundException si el curso no existe', async () => {
		coursePort.findById.mockResolvedValue(null);

		await expect(
			handler.execute(new ExportExcelCommand('course-1', 7, 2026, 'monthly')),
		).rejects.toBeInstanceOf(NotFoundException);
		expect(reporter.generateMonthlyReport).not.toHaveBeenCalled();
		expect(generator.generate).not.toHaveBeenCalled();
	});
});
