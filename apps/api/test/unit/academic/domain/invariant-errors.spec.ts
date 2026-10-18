import { DAYOFWEEK, LEVEL, SHIFT } from '@repo/common';
import { DomainError } from '../../../../src/common/errors';
import { AcademicYear } from '../../../../src/modules/academic/domain/entities/academic-year.entity';
import { Course } from '../../../../src/modules/academic/domain/entities/course.entity';
import { ScheduleSlot } from '../../../../src/modules/academic/domain/entities/schedule-slot.entity';
import { Subject } from '../../../../src/modules/academic/domain/entities/subject.entity';
import { AcademicYearId } from '../../../../src/modules/academic/domain/value-objects/academic-year-id.vo';
import { CourseId } from '../../../../src/modules/academic/domain/value-objects/course-id.vo';
import { DocumentNumber } from '../../../../src/modules/academic/domain/value-objects/document-number.vo';
import { StudentId } from '../../../../src/modules/academic/domain/value-objects/student-id.vo';
import { SubjectId } from '../../../../src/modules/academic/domain/value-objects/subject-id.vo';
import { expectThrow } from '../expect-rejection';

const academicYear = () =>
	AcademicYear.reconstitute({
		id: 'ay-1',
		tenantId: 'tenant-1',
		year: 2026,
		startDate: new Date('2026-03-01'),
		endDate: new Date('2026-12-15'),
		nonWorkingDays: [],
		absenceThresholdPercent: 15,
		lateCountAbscenseAfterMinutes: 15,
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date(),
	});

const subjectProps = {
	courseId: 'course-1',
	teacherId: 'teacher-1',
	name: 'Matemática',
	area: 'Exactas',
	weeklyHours: 4,
};

describe('Academic domain invariants answer DomainError (400) in Spanish', () => {
	it('AcademicYear rejects a year before 2020', () => {
		expectThrow(
			() => academicYear().changeYear(2019),
			DomainError,
			'El año debe ser 2020 o posterior.',
		);
	});

	it('AcademicYear rejects a start date that is not before the end date', () => {
		expectThrow(
			() =>
				academicYear().changeYearLapse(
					new Date('2026-12-15'),
					new Date('2026-03-01'),
				),
			DomainError,
			'La fecha de inicio debe ser anterior a la fecha de fin.',
		);
	});

	it('AcademicYear rejects out-of-range thresholds', () => {
		expectThrow(
			() => academicYear().updateThresholds(101),
			DomainError,
			'El umbral de inasistencias debe estar entre 0 y 100.',
		);
		expectThrow(
			() => academicYear().updateThresholds(undefined, -1),
			DomainError,
			'Los minutos de tardanza no pueden ser negativos.',
		);
	});

	it('Subject rejects fewer than one weekly hour on create and update', () => {
		const message = 'Las horas semanales deben ser al menos 1.';
		expectThrow(
			() => Subject.create({ ...subjectProps, weeklyHours: 0 }),
			DomainError,
			message,
		);
		expectThrow(
			() => Subject.create(subjectProps).updateDetails(undefined, undefined, 0),
			DomainError,
			message,
		);
	});

	it('Course rejects a year number outside 1 to 7', () => {
		expectThrow(
			() =>
				Course.create({
					tenantId: 'tenant-1',
					academicYearId: 'ay-1',
					preceptorId: 'preceptor-1',
					level: LEVEL.SECONDARY,
					yearNumber: 8,
					division: '1',
					shift: SHIFT.MORNING,
				}),
			DomainError,
			'El año del curso debe estar entre 1 y 7.',
		);
	});

	it('ScheduleSlot rejects a start time that is not before the end time', () => {
		expectThrow(
			() =>
				ScheduleSlot.create({
					subjectId: 'sub-1',
					courseId: 'course-1',
					dayOfWeek: DAYOFWEEK.MONDAY,
					startTime: '10:00',
					endTime: '09:00',
				}),
			DomainError,
			'La hora de inicio debe ser anterior a la hora de fin.',
		);
	});

	it('value objects reject empty or malformed values', () => {
		expectThrow(
			() => new StudentId(''),
			DomainError,
			'El identificador del estudiante es obligatorio.',
		);
		expectThrow(
			() => new CourseId(''),
			DomainError,
			'El identificador del curso es obligatorio.',
		);
		expectThrow(
			() => new SubjectId(''),
			DomainError,
			'El identificador de la materia es obligatorio.',
		);
		expectThrow(
			() => new AcademicYearId(''),
			DomainError,
			'El identificador del ciclo lectivo es obligatorio.',
		);
		expectThrow(
			() => new DocumentNumber(''),
			DomainError,
			'El número de documento es obligatorio.',
		);
		expectThrow(
			() => new DocumentNumber('1234'),
			DomainError,
			'El número de documento debe tener 8 dígitos.',
		);
		expectThrow(
			() => new DocumentNumber('00012345'),
			DomainError,
			'El número de documento no es válido.',
		);
	});
});
