import {
	BadRequestException,
	ForbiddenException,
	NotFoundException,
	UnprocessableEntityException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtPayload, LEVEL, ROLES, SHIFT, STUDENTSTATUS } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { CommitStudentImportHandler } from '../../../../src/modules/academic/application/commands/import-students/commit-student-import.handler';
import { PreviewStudentImportHandler } from '../../../../src/modules/academic/application/commands/import-students/preview-student-import.handler';
import { StudentImportFile } from '../../../../src/modules/academic/application/commands/import-students/student-import-file';
import { StudentImportService } from '../../../../src/modules/academic/application/commands/import-students/student-import.service';
import { Course } from '../../../../src/modules/academic/domain/entities/course.entity';
import { Student } from '../../../../src/modules/academic/domain/entities/student.entity';
import {
	IStudentImportFilePort,
	RawImportRow,
} from '../../../../src/modules/academic/domain/ports/student-import-file.port.interface';
import { IAcademicUnitOfWorkPort } from '../../../../src/modules/academic/domain/ports/unit-of-work.port.interface';
import { ICourseRepository } from '../../../../src/modules/academic/domain/repositories/course.repository.interface';
import { IStudentRepository } from '../../../../src/modules/academic/domain/repositories/student.repository.interface';

// student-import.handlers.spec.ts
const TENANT = 'tenant-1';
const COURSE_ID = '3f2c1d4e-5a6b-4c7d-8e9f-0a1b2c3d4e5f';
const OTHER_COURSE_ID = '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d';
const PRECEPTOR_ID = 'preceptor-1';

const makeCourse = (
	overrides: Partial<{ id: string; tenantId: string; preceptorId: string }> = {},
) =>
	Course.reconstitute({
		id: overrides.id ?? COURSE_ID,
		tenantId: overrides.tenantId ?? TENANT,
		academicYearId: 'year-1',
		preceptorId: overrides.preceptorId ?? PRECEPTOR_ID,
		level: LEVEL.DEFAULT,
		yearNumber: 2,
		division: 'A',
		shift: SHIFT.MORNING,
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date(),
	});

const user = (role: JwtPayload['role'], sub = 'admin-1'): JwtPayload => ({
	sub,
	tenantId: TENANT,
	role,
	email: 'u@example.com',
});

const file: StudentImportFile = {
	buffer: Buffer.from('x'),
	originalName: 'alumnos.xlsx',
	mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	size: 10,
};

const row = (n: number, over: Partial<RawImportRow> = {}): RawImportRow => ({
	rowNumber: n,
	lastName: 'González',
	firstName: 'Sofía',
	documentNumber: String(45000000 + n),
	birthDate: '15/03/2014',
	tutorName: 'María González',
	tutorPhone: '1155551234',
	tutorEmail: '',
	...over,
});

const existingStudent = (dni: string, courseId: string) =>
	Student.reconstitute({
		id: 'existing',
		courseId,
		tenantId: TENANT,
		firstName: 'Ana',
		lastName: 'Pérez',
		documentNumber: dni,
		birthDate: new Date('2013-01-01'),
		tutorName: 'Luis Pérez',
		tutorPhone: '1100000000',
		status: STUDENTSTATUS.ACTIVE,
		createdAt: new Date(),
		updatedAt: new Date(),
	});

describe('student bulk import', () => {
	let courseRepo: MockProxy<ICourseRepository>;
	let studentRepo: MockProxy<IStudentRepository>;
	let filePort: MockProxy<IStudentImportFilePort>;
	let unitOfWork: MockProxy<IAcademicUnitOfWorkPort>;
	let events: MockProxy<EventEmitter2>;
	let service: StudentImportService;

	beforeEach(() => {
		courseRepo = mock<ICourseRepository>();
		studentRepo = mock<IStudentRepository>();
		filePort = mock<IStudentImportFilePort>();
		unitOfWork = mock<IAcademicUnitOfWorkPort>();
		events = mock<EventEmitter2>();
		service = new StudentImportService(courseRepo, studentRepo);
		courseRepo.findById.mockResolvedValue(makeCourse());
		courseRepo.findByIds.mockResolvedValue([]);
		studentRepo.findByDocuments.mockResolvedValue([]);
		unitOfWork.run.mockImplementation((work) => work());
	});

	describe('preview', () => {
		let handler: PreviewStudentImportHandler;
		const run = (
			u = user(ROLES.ADMIN),
			f: StudentImportFile | undefined = file,
		) => handler.execute({ user: u, courseId: COURSE_ID, file: f });

		beforeEach(() => {
			handler = new PreviewStudentImportHandler(service, filePort);
		});

		it('returns every row valid and persists nothing', async () => {
			filePort.parse.mockResolvedValue([row(2), row(3)]);

			const result = await run();

			expect(result).toMatchObject({
				courseId: COURSE_ID,
				totalRows: 2,
				validRows: 2,
				invalidRows: 0,
			});
			expect(result.rows[0].data).toEqual({
				lastName: 'González',
				firstName: 'Sofía',
				documentNumber: '45000002',
				birthDate: '2014-03-15',
				tutorName: 'María González',
				tutorPhone: '1155551234',
				tutorEmail: null,
			});
			expect(studentRepo.save).not.toHaveBeenCalled();
		});

		it('reports missing required fields', async () => {
			filePort.parse.mockResolvedValue([
				row(2, { lastName: '', tutorPhone: ' ', birthDate: null }),
			]);

			const result = await run();

			expect(result.invalidRows).toBe(1);
			expect(result.rows[0].errors).toEqual(
				expect.arrayContaining([
					'El apellido es obligatorio',
					'El teléfono del tutor es obligatorio',
					'La fecha de nacimiento es obligatoria',
				]),
			);
		});

		it('reports a bad email but accepts an empty one', async () => {
			filePort.parse.mockResolvedValue([
				row(2, { tutorEmail: 'not-an-email' }),
				row(3, { tutorEmail: 'ok@example.com' }),
			]);

			const result = await run();

			expect(result.rows[0].errors).toEqual(['El email del tutor no es válido']);
			expect(result.rows[1].errors).toEqual([]);
			expect(result.rows[1].data.tutorEmail).toBe('ok@example.com');
		});

		it('rejects future and impossible dates, accepts Date cells', async () => {
			const future = new Date();
			future.setFullYear(future.getFullYear() + 1);
			filePort.parse.mockResolvedValue([
				row(2, { birthDate: '31/02/2014' }),
				row(3, { birthDate: future }),
				row(4, { birthDate: new Date(Date.UTC(2014, 2, 15)) }),
			]);

			const result = await run();

			expect(result.rows[0].errors).toEqual([
				'La fecha de nacimiento no es válida (use DD/MM/AAAA)',
			]);
			expect(result.rows[1].errors).toEqual([
				'La fecha de nacimiento no puede ser futura',
			]);
			expect(result.rows[2].errors).toEqual([]);
			expect(result.rows[2].data.birthDate).toBe('2014-03-15');
		});

		it('normalizes DNIs and rejects malformed ones', async () => {
			filePort.parse.mockResolvedValue([
				row(2, { documentNumber: '45.233.210' }),
				row(3, { documentNumber: '1234' }),
				row(4, { documentNumber: '4523321A' }),
			]);

			const result = await run();

			expect(result.rows[0].errors).toEqual([]);
			expect(result.rows[0].data.documentNumber).toBe('45233210');
			expect(result.rows[1].errors).toEqual(['El DNI debe tener 8 dígitos']);
			expect(result.rows[2].errors).toEqual(['El DNI debe tener 8 dígitos']);
		});

		it('flags duplicate DNIs in the file on every row after the first', async () => {
			filePort.parse.mockResolvedValue([
				row(2, { documentNumber: '45233210' }),
				row(3, { documentNumber: '40111222' }),
				row(4, { documentNumber: '45.233.210' }),
				row(5, { documentNumber: '45233210' }),
			]);

			const result = await run();

			expect(result.rows[0].errors).toEqual([]);
			expect(result.rows[2].errors).toEqual([
				'El DNI está repetido en el archivo (fila 2)',
			]);
			expect(result.rows[3].errors).toEqual([
				'El DNI está repetido en el archivo (fila 2)',
			]);
		});

		it('flags DNIs already in the tenant naming the course, in one batch', async () => {
			filePort.parse.mockResolvedValue([
				row(2, { documentNumber: '45233210' }),
				row(3, { documentNumber: '40111222' }),
			]);
			studentRepo.findByDocuments.mockResolvedValue([
				existingStudent('45233210', OTHER_COURSE_ID),
			]);
			courseRepo.findByIds.mockResolvedValue([
				makeCourse({ id: OTHER_COURSE_ID }),
			]);

			const result = await run();

			expect(result.rows[0].errors).toEqual(['El DNI ya está cargado en 2° "A"']);
			expect(result.rows[1].errors).toEqual([]);
			expect(studentRepo.findByDocuments).toHaveBeenCalledTimes(1);
			expect(studentRepo.findByDocuments).toHaveBeenCalledWith(
				['45233210', '40111222'],
				TENANT,
			);
		});

		it('allows a preceptor on their own course', async () => {
			filePort.parse.mockResolvedValue([row(2)]);

			await expect(
				run(user(ROLES.PRECEPTOR, PRECEPTOR_ID)),
			).resolves.toBeDefined();
		});

		it('forbids a preceptor on a course they do not have', async () => {
			await expect(run(user(ROLES.PRECEPTOR, 'someone-else'))).rejects.toThrow(
				ForbiddenException,
			);
			expect(filePort.parse).not.toHaveBeenCalled();
		});

		it('returns not found for a course of another tenant', async () => {
			courseRepo.findById.mockResolvedValue(makeCourse({ tenantId: 'other' }));

			await expect(run()).rejects.toThrow(NotFoundException);
		});

		it('returns not found for an unknown course', async () => {
			courseRepo.findById.mockResolvedValue(null);

			await expect(run()).rejects.toThrow(NotFoundException);
		});

		it('rejects a missing file, a non-xlsx file and an oversized file', async () => {
			await expect(
				handler.execute({
					user: user(ROLES.ADMIN),
					courseId: COURSE_ID,
					file: undefined,
				}),
			).rejects.toThrow(BadRequestException);
			await expect(
				run(user(ROLES.ADMIN), { ...file, originalName: 'alumnos.csv' }),
			).rejects.toThrow(BadRequestException);
			await expect(
				run(user(ROLES.ADMIN), { ...file, size: 2 * 1024 * 1024 }),
			).rejects.toThrow(BadRequestException);
		});
	});

	describe('commit', () => {
		let handler: CommitStudentImportHandler;
		const run = (u = user(ROLES.ADMIN)) =>
			handler.execute({ user: u, courseId: COURSE_ID, file });

		beforeEach(() => {
			handler = new CommitStudentImportHandler(
				service,
				filePort,
				studentRepo,
				unitOfWork,
				events,
			);
		});

		it('persists nothing and returns the preview when any row has errors', async () => {
			filePort.parse.mockResolvedValue([row(2), row(3, { lastName: '' })]);

			const error = await run().catch((e) => e);

			expect(error).toBeInstanceOf(UnprocessableEntityException);
			expect(error.getResponse().details).toMatchObject({
				courseId: COURSE_ID,
				totalRows: 2,
				validRows: 1,
				invalidRows: 1,
			});
			expect(studentRepo.save).not.toHaveBeenCalled();
			expect(events.emit).not.toHaveBeenCalled();
		});

		it('inserts every student in one transaction and emits events afterwards', async () => {
			filePort.parse.mockResolvedValue([
				row(2),
				row(3, { tutorEmail: 'maria@example.com' }),
			]);
			let insideTransaction = false;
			unitOfWork.run.mockImplementation(async (work) => {
				insideTransaction = true;
				try {
					return await work();
				} finally {
					insideTransaction = false;
				}
			});
			const savedInsideTx: boolean[] = [];
			studentRepo.save.mockImplementation(async () => {
				savedInsideTx.push(insideTransaction);
			});
			const emittedInsideTx: boolean[] = [];
			events.emit.mockImplementation(() => {
				emittedInsideTx.push(insideTransaction);
				return true;
			});

			const result = await run();

			expect(result).toEqual({ created: 2 });
			expect(unitOfWork.run).toHaveBeenCalledTimes(1);
			expect(studentRepo.save).toHaveBeenCalledTimes(2);
			expect(savedInsideTx).toEqual([true, true]);
			expect(events.emit).toHaveBeenCalledTimes(2);
			expect(events.emit).toHaveBeenCalledWith(
				'student.created',
				expect.any(Student),
			);
			expect(emittedInsideTx).toEqual([false, false]);
			const saved = studentRepo.save.mock.calls[1][0];
			expect(saved.courseId).toBe(COURSE_ID);
			expect(saved.tenantId).toBe(TENANT);
			expect(saved.tutorEmail).toBe('maria@example.com');
			expect(saved.birthDate.toISOString()).toBe('2014-03-15T00:00:00.000Z');
		});

		it('does not emit events when the transaction fails', async () => {
			filePort.parse.mockResolvedValue([row(2), row(3)]);
			studentRepo.save
				.mockResolvedValueOnce(undefined)
				.mockRejectedValueOnce(new Error('db down'));

			await expect(run()).rejects.toThrow('db down');
			expect(events.emit).not.toHaveBeenCalled();
		});

		it('forbids a preceptor on a course they do not have', async () => {
			await expect(run(user(ROLES.PRECEPTOR, 'someone-else'))).rejects.toThrow(
				ForbiddenException,
			);
			expect(unitOfWork.run).not.toHaveBeenCalled();
		});
	});
});
