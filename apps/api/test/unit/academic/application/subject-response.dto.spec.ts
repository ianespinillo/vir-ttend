import { SUBJECT_KIND } from '@repo/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateSubjectRequestDto } from '../../../../src/modules/academic/application/dtos/create-subject.request.dto';
import { SubjectResponseDto } from '../../../../src/modules/academic/application/dtos/subject.response.dto';
import { UpdateSubjectRequestDto } from '../../../../src/modules/academic/application/dtos/update-subject.request.dto';
import { Subject } from '../../../../src/modules/academic/domain/entities/subject.entity';

const base = {
	courseId: 'course-1',
	name: 'Carpintería',
	area: 'Taller',
	weeklyHours: 4,
	kind: SUBJECT_KIND.WORKSHOP,
};

describe('SubjectResponseDto teachers', () => {
	const names = new Map([
		['teacher-a', 'Ada Lovelace'],
		['teacher-b', 'Grace Hopper'],
	]);

	it('exposes a whole-subject teacher through the compat fields and teachers', () => {
		const dto = new SubjectResponseDto(
			Subject.create({ ...base, teacherId: 'teacher-a' }),
			names,
		);

		expect(dto.teacherId).toBe('teacher-a');
		expect(dto.teacherName).toBe('Ada Lovelace');
		expect(dto.teachers).toEqual([
			{
				commissionNumber: null,
				teacherId: 'teacher-a',
				teacherName: 'Ada Lovelace',
			},
		]);
	});

	it('resolves one name per commission and keeps commission 1 as the compat teacher', () => {
		const dto = new SubjectResponseDto(
			Subject.create({
				...base,
				teachers: [
					{ commissionNumber: 2, teacherId: 'teacher-b' },
					{ commissionNumber: 1, teacherId: 'teacher-a' },
				],
			}),
			names,
		);

		expect(dto.teachers.map((t) => [t.commissionNumber, t.teacherName])).toEqual([
			[1, 'Ada Lovelace'],
			[2, 'Grace Hopper'],
		]);
		expect(dto.teacherId).toBe('teacher-a');
		expect(dto.teacherName).toBe('Ada Lovelace');
	});

	it('falls back to the manual name and has no teachers when none is set', () => {
		const manual = new SubjectResponseDto(
			Subject.create({
				...base,
				teachers: [{ commissionNumber: 1, teacherName: 'Laura Gómez' }],
			}),
		);
		expect(manual.teacherId).toBeUndefined();
		expect(manual.teacherName).toBe('Laura Gómez');

		const none = new SubjectResponseDto(Subject.create(base));
		expect(none.teachers).toEqual([]);
		expect(none.teacherId).toBeUndefined();
	});
});

describe('subject request DTOs with teachers', () => {
	it('accepts one teacher per commission and a whole-subject entry', async () => {
		const create = plainToInstance(CreateSubjectRequestDto, {
			...base,
			teachers: [
				{ commissionNumber: 1, teacherId: 'a' },
				{ commissionNumber: 2, teacherName: 'Laura Gómez' },
			],
		});
		const update = plainToInstance(UpdateSubjectRequestDto, {
			teachers: [{ commissionNumber: null, teacherId: 'a' }],
		});

		expect(await validate(create)).toHaveLength(0);
		expect(await validate(update)).toHaveLength(0);
	});

	it('rejects an invalid commission or more than two entries', async () => {
		const badCommission = plainToInstance(CreateSubjectRequestDto, {
			...base,
			teachers: [{ commissionNumber: 3, teacherId: 'a' }],
		});
		const tooMany = plainToInstance(UpdateSubjectRequestDto, {
			teachers: [
				{ commissionNumber: 1, teacherId: 'a' },
				{ commissionNumber: 2, teacherId: 'b' },
				{ commissionNumber: null, teacherId: 'c' },
			],
		});

		expect((await validate(badCommission)).map((e) => e.property)).toContain(
			'teachers',
		);
		expect((await validate(tooMany)).map((e) => e.property)).toContain(
			'teachers',
		);
	});
});
