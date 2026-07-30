import { MonthlyReport } from '../entities/monthly-report.entity';
import { ReportPeriod } from '../value-objects/report-period.vo';

export interface IReportRepository {
	findByCourseAndPeriod(
		courseId: string,
		period: ReportPeriod,
	): Promise<MonthlyReport | null>;
	findByCourse(courseId: string): Promise<MonthlyReport[]>;
	save(report: MonthlyReport): Promise<void>;
}
