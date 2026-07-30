import { ATTENDANCE_STATUS, LEVEL } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { GetMonthlyReportQueryHandler } from '../../../src/modules/reporting/application/queries/get-monthly-report/get-monthly-report.handler';
import { GetMonthlyReportQuery } from '../../../src/modules/reporting/application/queries/get-monthly-report/get-monthly-report.query';
import { ReportGenerationService } from '../../../src/modules/reporting/application/services/report-generation.service';
import { Course } from '../../../src/modules/reporting/domain/entities/course.entity';
import { MonthlyReport } from '../../../src/modules/reporting/domain/entities/monthly-report.entity';
import { ICoursePort } from '../../../src/modules/reporting/domain/ports/course.port.interface';
import { IReportRepository } from '../../../src/modules/reporting/domain/repositories/report.repository.interface';
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

describe('GetMonthlyReportQueryHandler', () => {
	let handler: GetMonthlyReportQueryHandler;
	let repo: MockProxy<IReportRepository>;
	let coursePort: MockProxy<ICoursePort>;
	let reportService: MockProxy<ReportGenerationService>;

	const query = new GetMonthlyReportQuery('course-1', 7, 2026);

	beforeEach(() => {
		repo = mock<IReportRepository>();
		coursePort = mock<ICoursePort>();
		reportService = mock<ReportGenerationService>();

		coursePort.findById.mockResolvedValue(course);
		reportService.generateMonthlyReport.mockResolvedValue(dummyData);

		handler = new GetMonthlyReportQueryHandler(repo, coursePort, reportService);
	});

	it('lanza NotFoundException si el curso no existe', async () => {
		coursePort.findById.mockResolvedValue(null);
		await expect(handler.execute(query)).rejects.toThrow('Course not found');
		expect(repo.save).not.toHaveBeenCalled();
	});

	it('devuelve el reporte existente sin generar uno nuevo', async () => {
		const existingReport = MonthlyReport.reconstitute({
			id: 'report-1',
			tenantId: 'tenant-1',
			courseId: 'course-1',
			academicYearId: 'ay-1',
			month: 7,
			year: 2026,
			data: dummyData,
			generatedAt: new Date('2026-07-01'),
			createdAt: new Date('2026-07-01'),
		});
		repo.findByCourseAndPeriod.mockResolvedValue(existingReport);

		const result = await handler.execute(query);

		expect(result.id).toBe('report-1');
		expect(repo.save).not.toHaveBeenCalled();
		expect(reportService.generateMonthlyReport).not.toHaveBeenCalled();
	});

	it('genera, guarda y devuelve un reporte nuevo si no existe', async () => {
		repo.findByCourseAndPeriod.mockResolvedValue(null);

		const result = await handler.execute(query);

		expect(reportService.generateMonthlyReport).toHaveBeenCalledWith(
			'course-1',
			expect.objectContaining({ month: 7, year: 2026 }),
		);
		expect(repo.save).toHaveBeenCalledTimes(1);
		expect(result.courseName).toBe('3° A');
	});

	it('persiste el reporte nuevo usando tenantId y academicYearId del curso', async () => {
		repo.findByCourseAndPeriod.mockResolvedValue(null);

		await handler.execute(query);

		const saved = repo.save.mock.calls[0][0];
		expect(saved.tenantId).toBe('tenant-1');
		expect(saved.academicYearId).toBe('ay-1');
		expect(saved.courseId).toBe('course-1');
		expect(saved.month).toBe(7);
		expect(saved.year).toBe(2026);
	});
});
