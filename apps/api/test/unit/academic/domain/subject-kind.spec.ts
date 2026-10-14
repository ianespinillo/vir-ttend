import { EntityManager } from '@mikro-orm/core';
import { SUBJECT_KIND } from '@repo/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateSubjectRequestDto } from '../../../../src/modules/academic/application/dtos/create-subject.request.dto';
import { UpdateSubjectRequestDto } from '../../../../src/modules/academic/application/dtos/update-subject.request.dto';
import { Subject } from '../../../../src/modules/academic/domain/entities/subject.entity';
import { SubjectMapper } from '../../../../src/modules/academic/infrastructure/persistence/mappers/subject.mapper';

const baseProps = {
	courseId: 'course-1',
	teacherId: 'teacher-1',
	name: 'Carpinteria',
	area: 'Taller',
	weeklyHours: 4,
};

describe('Subject kind', () => {
	it('defaults to theory when not provided', () => {
		expect(Subject.create(baseProps).kind).toBe(SUBJECT_KIND.THEORY);
		expect(Subject.create(baseProps).isWorkshop).toBe(false);
	});

	it('creates workshop subjects and allows changing the kind', () => {
		const subject = Subject.create({ ...baseProps, kind: SUBJECT_KIND.WORKSHOP });
		expect(subject.kind).toBe(SUBJECT_KIND.WORKSHOP);
		expect(subject.isWorkshop).toBe(true);

		subject.updateDetails(undefined, undefined, undefined, SUBJECT_KIND.THEORY);
		expect(subject.kind).toBe(SUBJECT_KIND.THEORY);
	});

	it('keeps the kind when updateDetails does not receive one', () => {
		const subject = Subject.create({ ...baseProps, kind: SUBJECT_KIND.WORKSHOP });
		subject.updateDetails('Electricidad');
		expect(subject.kind).toBe(SUBJECT_KIND.WORKSHOP);
	});

	it('reconstitutes legacy data without kind as theory', () => {
		const subject = Subject.reconstitute({
			...baseProps,
			id: 'sub-1',
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		expect(subject.kind).toBe(SUBJECT_KIND.THEORY);
	});

	it('maps kind to and from the ORM entity', () => {
		const em = {
			getReference: jest.fn((_entity: unknown, id: string) => ({ id })),
		} as unknown as EntityManager;
		const domain = Subject.create({ ...baseProps, kind: SUBJECT_KIND.WORKSHOP });

		const orm = SubjectMapper.toOrm(domain, em);
		expect(orm.kind).toBe(SUBJECT_KIND.WORKSHOP);
		expect(SubjectMapper.toDomain(orm).kind).toBe(SUBJECT_KIND.WORKSHOP);
	});

	describe('request DTO validation', () => {
		it('accepts a create request without kind', async () => {
			const dto = plainToInstance(CreateSubjectRequestDto, baseProps);
			expect(await validate(dto)).toHaveLength(0);
		});

		it('accepts theory and workshop on create', async () => {
			for (const kind of Object.values(SUBJECT_KIND)) {
				const dto = plainToInstance(CreateSubjectRequestDto, {
					...baseProps,
					kind,
				});
				expect(await validate(dto)).toHaveLength(0);
			}
		});

		it('rejects an unknown kind on create and update', async () => {
			const create = plainToInstance(CreateSubjectRequestDto, {
				...baseProps,
				kind: 'lab',
			});
			const update = plainToInstance(UpdateSubjectRequestDto, { kind: 'lab' });

			expect((await validate(create)).map((e) => e.property)).toContain('kind');
			expect((await validate(update)).map((e) => e.property)).toContain('kind');
		});
	});
});
