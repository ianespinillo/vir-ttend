import { mock } from 'jest-mock-extended';
import { NotFoundError } from '../../../src/common/errors';
import { GetCourseSummaryQueryHandler } from '../../../src/modules/reporting/application/queries/get-course-summary/get-course-summary.handler';
import { GetCourseSummaryQuery } from '../../../src/modules/reporting/application/queries/get-course-summary/get-course-summary.query';
import { IAcademicYearPort } from '../../../src/modules/reporting/domain/ports/academic-year.port.interface';
import { IReportRepository } from '../../../src/modules/reporting/domain/repositories/report.repository.interface';

describe('GetCourseSummaryQueryHandler', () => {
	it('answers not found when the academic year does not exist', async () => {
		const repo = mock<IReportRepository>();
		const academicYearPort = mock<IAcademicYearPort>();
		academicYearPort.findById.mockResolvedValue(null);
		const handler = new GetCourseSummaryQueryHandler(repo, academicYearPort);

		const attempt = handler.execute(
			new GetCourseSummaryQuery('course-1', 'missing-year'),
		);
		await expect(attempt).rejects.toBeInstanceOf(NotFoundError);
		await expect(attempt).rejects.toThrow('Ciclo lectivo no encontrado');
		expect(repo.findByCourse).not.toHaveBeenCalled();
	});
});
