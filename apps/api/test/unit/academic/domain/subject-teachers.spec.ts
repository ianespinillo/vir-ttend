import { SUBJECT_KIND } from '@repo/common';
import { DomainError } from '../../../../src/common/errors';
import { Subject } from '../../../../src/modules/academic/domain/entities/subject.entity';

const base = {
	courseId: 'course-1',
	name: 'Carpintería',
	area: 'Taller',
	weeklyHours: 4,
};
const workshop = { ...base, kind: SUBJECT_KIND.WORKSHOP };

describe('Subject teacher assignments', () => {
	it('treats teacherId / teacherName as the whole-subject teacher', () => {
		const withAccount = Subject.create({ ...base, teacherId: 't1' });
		expect(withAccount.teachers).toEqual([
			{ commissionNumber: null, teacherId: 't1', teacherName: undefined },
		]);

		const external = Subject.create({ ...base, teacherName: '  Laura  ' });
		expect(external.teacherId).toBeUndefined();
		expect(external.teacherName).toBe('Laura');
	});

	it('drops the name while an account is set', () => {
		const subject = Subject.create({
			...base,
			teacherId: 't1',
			teacherName: 'Laura',
		});
		expect(subject.teacherName).toBeUndefined();
	});

	it('has no teachers when none is given', () => {
		const subject = Subject.create(base);
		expect(subject.teachers).toEqual([]);
		expect(subject.teacherIds).toEqual([]);
		expect(subject.commissionsTaughtBy('t1')).toEqual([]);
		expect(subject.isTaughtBy('t1')).toBe(false);
	});

	it('lets a workshop have one teacher per commission', () => {
		const subject = Subject.create({
			...workshop,
			teachers: [
				{ commissionNumber: 2, teacherId: 'b' },
				{ commissionNumber: 1, teacherId: 'a' },
			],
		});
		expect(subject.teachers.map((t) => t.commissionNumber)).toEqual([1, 2]);
		expect(subject.teacherIds).toEqual(['a', 'b']);
		expect(subject.commissionsTaughtBy('a')).toEqual([1]);
		expect(subject.commissionsTaughtBy('b')).toEqual([2]);
		expect(subject.commissionsTaughtBy('c')).toEqual([]);
		expect(subject.isTaughtBy('b')).toBe(true);
	});

	it('exposes the whole-subject teacher, else the first commission, as the single teacher', () => {
		const whole = Subject.create({ ...workshop, teacherId: 'w' });
		expect(whole.teacherId).toBe('w');
		expect(whole.commissionsTaughtBy('w')).toBe('all');

		const split = Subject.create({
			...workshop,
			teachers: [
				{ commissionNumber: 2, teacherId: 'b' },
				{ commissionNumber: 1, teacherName: 'Laura' },
			],
		});
		expect(split.teacherId).toBeUndefined();
		expect(split.teacherName).toBe('Laura');

		const onlySecond = Subject.create({
			...workshop,
			teachers: [{ commissionNumber: 2, teacherId: 'b' }],
		});
		expect(onlySecond.teacherId).toBe('b');
	});

	it('ignores empty assignments', () => {
		const subject = Subject.create({
			...workshop,
			teachers: [
				{ commissionNumber: 1, teacherName: '   ' },
				{ commissionNumber: 2, teacherId: 'b' },
			],
		});
		expect(subject.teachers).toHaveLength(1);
	});

	describe('invariants', () => {
		it('rejects a duplicated commission', () => {
			expect(() =>
				Subject.create({
					...workshop,
					teachers: [
						{ commissionNumber: 1, teacherId: 'a' },
						{ commissionNumber: 1, teacherId: 'b' },
					],
				}),
			).toThrow(DomainError);
			expect(() =>
				Subject.create({
					...workshop,
					teachers: [
						{ commissionNumber: null, teacherId: 'a' },
						{ commissionNumber: null, teacherId: 'b' },
					],
				}),
			).toThrow(DomainError);
		});

		it('rejects mixing a whole-subject teacher with commission teachers', () => {
			expect(() =>
				Subject.create({
					...workshop,
					teachers: [
						{ commissionNumber: null, teacherId: 'a' },
						{ commissionNumber: 1, teacherId: 'b' },
					],
				}),
			).toThrow(DomainError);
		});

		it('rejects commission teachers on theory subjects', () => {
			expect(() =>
				Subject.create({
					...base,
					teachers: [{ commissionNumber: 1, teacherId: 'a' }],
				}),
			).toThrow(DomainError);
		});

		it('blocks turning a workshop with commission teachers into theory', () => {
			const subject = Subject.create({
				...workshop,
				teachers: [{ commissionNumber: 1, teacherId: 'a' }],
			});
			expect(() =>
				subject.updateDetails(undefined, undefined, undefined, SUBJECT_KIND.THEORY),
			).toThrow(DomainError);
			expect(subject.kind).toBe(SUBJECT_KIND.WORKSHOP);

			const whole = Subject.create({ ...workshop, teacherId: 'a' });
			whole.updateDetails(undefined, undefined, undefined, SUBJECT_KIND.THEORY);
			expect(whole.kind).toBe(SUBJECT_KIND.THEORY);
		});
	});

	describe('mutations', () => {
		it('assigns a teacher per commission keeping the other one', () => {
			const subject = Subject.create(workshop);
			subject.assignTeacher('a', 1);
			subject.assignExternalTeacher('Laura', 2);
			expect(subject.commissionsTaughtBy('a')).toEqual([1]);
			expect(subject.teachers[1]).toEqual({
				commissionNumber: 2,
				teacherId: undefined,
				teacherName: 'Laura',
			});

			subject.assignTeacher('c', 1);
			expect(subject.commissionsTaughtBy('a')).toEqual([]);
			expect(subject.commissionsTaughtBy('c')).toEqual([1]);
		});

		it('a whole-subject assignment replaces every commission teacher', () => {
			const subject = Subject.create({
				...workshop,
				teachers: [
					{ commissionNumber: 1, teacherId: 'a' },
					{ commissionNumber: 2, teacherId: 'b' },
				],
			});
			subject.assignTeacher('w');
			expect(subject.teachers).toEqual([
				{ commissionNumber: null, teacherId: 'w', teacherName: undefined },
			]);
		});

		it('refuses a commission assignment over a whole-subject teacher', () => {
			const subject = Subject.create({ ...workshop, teacherId: 'w' });
			expect(() => subject.assignTeacher('a', 1)).toThrow(DomainError);
			expect(subject.teacherId).toBe('w');
		});

		it('refuses a commission assignment on a theory subject', () => {
			const subject = Subject.create(base);
			expect(() => subject.assignTeacher('a', 1)).toThrow(DomainError);
		});

		it('unassigns everything or a single commission', () => {
			const subject = Subject.create({
				...workshop,
				teachers: [
					{ commissionNumber: 1, teacherId: 'a' },
					{ commissionNumber: 2, teacherId: 'b' },
				],
			});
			subject.unassignCommissionTeacher(1);
			expect(subject.teacherIds).toEqual(['b']);
			subject.unassignTeacher();
			expect(subject.teachers).toEqual([]);
		});

		it('replaces all the assignments validating them', () => {
			const subject = Subject.create({ ...workshop, teacherId: 'w' });
			subject.replaceTeachers([
				{ commissionNumber: 1, teacherId: 'a' },
				{ commissionNumber: 2, teacherId: 'b' },
			]);
			expect(subject.teacherIds).toEqual(['a', 'b']);
			expect(() =>
				subject.replaceTeachers([
					{ commissionNumber: null, teacherId: 'a' },
					{ commissionNumber: 2, teacherId: 'b' },
				]),
			).toThrow(DomainError);
		});
	});

	it('compares subjects by their teachers', () => {
		const a = Subject.create({ ...workshop, teacherId: 'a' });
		const same = Subject.create({ ...workshop, teacherId: 'a' });
		const other = Subject.create({ ...workshop, teacherId: 'b' });
		const split = Subject.create({
			...workshop,
			teachers: [{ commissionNumber: 1, teacherId: 'a' }],
		});
		expect(a.equals(same)).toBe(true);
		expect(a.equals(other)).toBe(false);
		expect(a.equals(split)).toBe(false);
	});
});
