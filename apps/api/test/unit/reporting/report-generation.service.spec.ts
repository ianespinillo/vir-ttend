import type { AttendanceStatus } from '@repo/common';
import { ATTENDANCE_STATUS, LEVEL } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { ReportGenerationService } from '../../../src/modules/reporting/application/services/report-generation.service';
import { AcademicYear } from '../../../src/modules/reporting/domain/entities/academic-year.entity';
import { AttendanceAlert } from '../../../src/modules/reporting/domain/entities/attendance-alert.entity';
import { AttendanceRecord } from '../../../src/modules/reporting/domain/entities/attendance-record.entity';
import { Course } from '../../../src/modules/reporting/domain/entities/course.entity';
import { Student } from '../../../src/modules/reporting/domain/entities/student.entity';
import { IAcademicYearPort } from '../../../src/modules/reporting/domain/ports/academic-year.port.interface';
import { IAttendanceAlertPort } from '../../../src/modules/reporting/domain/ports/attendance-alert.port.interface';
import { IAttendanceRecordPort } from '../../../src/modules/reporting/domain/ports/attendance.port.interface';
import { ICoursePort } from '../../../src/modules/reporting/domain/ports/course.port.interface';
import { IStudentPort } from '../../../src/modules/reporting/domain/ports/student.port.interface';
import { ReportPeriod } from '../../../src/modules/reporting/domain/value-objects/report-period.vo';

const makeRecord = (
	status: AttendanceStatus,
	studentId: string,
	date?: Date,
): AttendanceRecord =>
	AttendanceRecord.reconstitute({
		id: `rec-${Math.random().toString(36).slice(2)}`,
		studentId,
		courseId: 'course-1',
		date: date ?? new Date(2026, 6, 1),
		status,
	});

const jul1 = new Date(2026, 6, 1);
const jul2 = new Date(2026, 6, 2);
const jul3 = new Date(2026, 6, 3);
const aug1 = new Date(2026, 7, 1);
const aug2 = new Date(2026, 7, 2);
const aug3 = new Date(2026, 7, 3);
const jun1 = new Date(2026, 5, 1);
const jun2 = new Date(2026, 5, 2);
const jun3 = new Date(2026, 5, 3);
const aug31 = new Date(2026, 7, 31);

const student = Student.reconstitute({
	id: 'student-1',
	name: 'Juan Pérez',
	documentNumber: 'DNI123',
});

const course = Course.reconstitute({
	id: 'course-1',
	name: '3° A',
	level: LEVEL.PRIMARY,
	academicYearId: 'ay-1',
	tenantId: 'tenant-1',
});

describe('ReportGenerationService', () => {
	let service: ReportGenerationService;
	let studentPort: MockProxy<IStudentPort>;
	let coursePort: MockProxy<ICoursePort>;
	let academicYearPort: MockProxy<IAcademicYearPort>;
	let attendanceRecordPort: MockProxy<IAttendanceRecordPort>;
	let alertsPort: MockProxy<IAttendanceAlertPort>;

	beforeEach(() => {
		studentPort = mock<IStudentPort>();
		coursePort = mock<ICoursePort>();
		academicYearPort = mock<IAcademicYearPort>();
		attendanceRecordPort = mock<IAttendanceRecordPort>();
		alertsPort = mock<IAttendanceAlertPort>();

		studentPort.findStudent.mockResolvedValue(student);
		alertsPort.findByStudentId.mockResolvedValue([]);

		service = new ReportGenerationService(
			attendanceRecordPort,
			alertsPort,
			studentPort,
			academicYearPort,
			coursePort,
		);
	});

	describe('generateMonthlyReport', () => {
		const period = ReportPeriod.generate(7, 2026);

		beforeEach(() => {
			coursePort.findById.mockResolvedValue(course);
			academicYearPort.getWorkingDaysBYAcademicYear.mockResolvedValue(22);
		});

		it('lanza NotFoundException si el curso no existe', async () => {
			coursePort.findById.mockResolvedValue(null);
			await expect(
				service.generateMonthlyReport('invalid', period),
			).rejects.toThrow('Course not found');
		});

		it('retorna MonthlyReportData con summary correcto', async () => {
			attendanceRecordPort.findByCourseAndDateRange.mockResolvedValue([
				makeRecord(ATTENDANCE_STATUS.PRESENT, 'student-1', jul1),
				makeRecord(ATTENDANCE_STATUS.PRESENT, 'student-2', jul1),
				makeRecord(ATTENDANCE_STATUS.ABSENT, 'student-2', jul2),
			]);

			const student2 = Student.reconstitute({
				id: 'student-2',
				name: 'María Gómez',
				documentNumber: 'DNI456',
			});
			studentPort.findStudent
				.mockResolvedValueOnce(student)
				.mockResolvedValueOnce(student2);

			alertsPort.findByStudentId.mockResolvedValue([]);

			const result = await service.generateMonthlyReport('course-1', period);

			expect(result.courseName).toBe('3° A');
			expect(result.level).toBe(LEVEL.PRIMARY);
			expect(result.workingDays).toBe(22);
			expect(result.period).toEqual({ month: 7, year: 2026 });
			expect(result.students).toHaveLength(2);
			expect(result.summary.averageAttendance).toBeCloseTo(2 / 3, 2);
		});

		it('consulta registros con las fechas del período', async () => {
			attendanceRecordPort.findByCourseAndDateRange.mockResolvedValue([]);

			await service.generateMonthlyReport('course-1', period);

			expect(attendanceRecordPort.findByCourseAndDateRange).toHaveBeenCalledWith(
				'course-1',
				new Date(2026, 6, 1),
				new Date(2026, 7, 0),
			);
		});
	});
});
