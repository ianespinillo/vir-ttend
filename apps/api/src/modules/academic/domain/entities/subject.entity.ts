// subject.entity.ts
import { randomUUID } from 'node:crypto';
import { CommissionNumber, SUBJECT_KIND, SubjectKindType } from '@repo/common';
import { DomainError } from '../../../../common/errors';
import { SubjectId } from '../value-objects/subject-id.vo';
import {
	SubjectTeacherAssignment,
	TaughtCommissions,
	normalizeTeacherAssignment,
} from '../value-objects/subject-teacher-assignment.vo';

/** Teacher fields shared by create and reconstitute. */
interface TeacherProps {
	/** Per-commission teachers. When given it wins over teacherId / teacherName. */
	teachers?: SubjectTeacherAssignment[];
	/** Shorthand for a single teacher of the whole subject (null commission). */
	teacherId?: string;
	/** Teacher without a user account; only kept while teacherId is unset. */
	teacherName?: string;
}

interface CreateProps extends TeacherProps {
	courseId: string;
	name: string;
	area: string;
	weeklyHours: number;
	kind?: SubjectKindType;
}

interface ConstructorProps {
	id: SubjectId;
	courseId: string;
	teachers: SubjectTeacherAssignment[];
	name: string;
	area: string;
	weeklyHours: number;
	kind: SubjectKindType;
	createdAt: Date;
	updatedAt: Date;
	deletedAt?: Date;
}

export interface ReconstituteProps extends TeacherProps {
	id: string;
	courseId: string;
	name: string;
	area: string;
	weeklyHours: number;
	kind?: SubjectKindType;
	createdAt: Date;
	updatedAt: Date;
	deletedAt?: Date;
}

export class Subject {
	private readonly _id: SubjectId;
	private readonly _courseId: string;
	private _teachers: SubjectTeacherAssignment[];
	private _name: string;
	private _area: string;
	private _weeklyHours: number;
	private _kind: SubjectKindType;
	private readonly _createdAt: Date;
	private _updatedAt: Date;
	private _deletedAt?: Date;

	private constructor(props: ConstructorProps) {
		this._id = props.id;
		this._courseId = props.courseId;
		this._name = props.name;
		this._area = props.area;
		this._weeklyHours = props.weeklyHours;
		this._kind = props.kind;
		this._teachers = Subject.validateTeachers(props.kind, props.teachers);
		this._createdAt = props.createdAt;
		this._updatedAt = props.updatedAt;
		this._deletedAt = props.deletedAt;
	}

	static create(props: CreateProps): Subject {
		if (props.weeklyHours < 1) {
			throw new DomainError('Las horas semanales deben ser al menos 1.');
		}
		const { teacherId, teacherName, teachers, ...rest } = props;
		return new Subject({
			id: new SubjectId(randomUUID()),
			createdAt: new Date(),
			updatedAt: new Date(),
			...rest,
			teachers: Subject.resolveTeachers({ teachers, teacherId, teacherName }),
			kind: props.kind ?? SUBJECT_KIND.THEORY,
			deletedAt: undefined,
		});
	}

	static reconstitute(props: ReconstituteProps): Subject {
		const { teacherId, teacherName, teachers, ...rest } = props;
		return new Subject({
			...rest,
			teachers: Subject.resolveTeachers({ teachers, teacherId, teacherName }),
			kind: props.kind ?? SUBJECT_KIND.THEORY,
			id: new SubjectId(props.id),
			deletedAt: props.deletedAt,
		});
	}

	private static resolveTeachers(
		props: TeacherProps,
	): SubjectTeacherAssignment[] {
		if (props.teachers) return props.teachers;
		return [
			{
				commissionNumber: null,
				teacherId: props.teacherId,
				teacherName: props.teacherName,
			},
		];
	}

	/**
	 * Normalizes the assignments (drops empty ones, trims names) and enforces
	 * the invariants: no duplicated commission, a single whole-subject teacher
	 * or per-commission teachers but never both, and per-commission teachers
	 * only on workshop subjects. Returns them ordered: whole subject, 1, 2.
	 */
	private static validateTeachers(
		kind: SubjectKindType,
		assignments: SubjectTeacherAssignment[],
	): SubjectTeacherAssignment[] {
		const normalized = assignments
			.map((a) => normalizeTeacherAssignment(a))
			.filter((a): a is SubjectTeacherAssignment => a !== null);
		const keys = normalized.map((a) => a.commissionNumber ?? 0);
		if (new Set(keys).size !== keys.length) {
			throw new DomainError(
				'Una comisión no puede tener más de un docente asignado.',
			);
		}
		const whole = normalized.some((a) => a.commissionNumber === null);
		const perCommission = normalized.some((a) => a.commissionNumber !== null);
		if (whole && perCommission) {
			throw new DomainError(
				'La materia no puede tener un docente para todo el curso y docentes por comisión a la vez.',
			);
		}
		if (perCommission && kind !== SUBJECT_KIND.WORKSHOP) {
			throw new DomainError(
				'Solo los talleres pueden tener un docente por comisión.',
			);
		}
		return normalized.sort(
			(a, b) => (a.commissionNumber ?? 0) - (b.commissionNumber ?? 0),
		);
	}

	get id(): SubjectId {
		return this._id;
	}
	get courseId(): string {
		return this._courseId;
	}
	/** Every teacher assignment: whole subject first, then by commission. */
	get teachers(): readonly SubjectTeacherAssignment[] {
		return this._teachers;
	}
	/**
	 * Teacher seen by clients that know a single teacher per subject: the
	 * whole-subject one, else commission 1's, else commission 2's.
	 */
	get teacherId(): string | undefined {
		return this._teachers[0]?.teacherId;
	}
	get teacherName(): string | undefined {
		return this._teachers[0]?.teacherName;
	}
	/** Distinct accounts teaching any commission of this subject. */
	get teacherIds(): string[] {
		return Array.from(
			new Set(
				this._teachers
					.map((a) => a.teacherId)
					.filter((id): id is string => Boolean(id)),
			),
		);
	}
	get hasCommissionTeachers(): boolean {
		return this._teachers.some((a) => a.commissionNumber !== null);
	}
	get name(): string {
		return this._name;
	}
	get area(): string {
		return this._area;
	}
	get weeklyHours(): number {
		return this._weeklyHours;
	}
	get kind(): SubjectKindType {
		return this._kind;
	}
	get isWorkshop(): boolean {
		return this._kind === SUBJECT_KIND.WORKSHOP;
	}
	get createdAt(): Date {
		return this._createdAt;
	}
	get updatedAt(): Date {
		return this._updatedAt;
	}
	get deletedAt() {
		return this._deletedAt;
	}

	/**
	 * Assigns an account as teacher. Without commission it covers the whole
	 * subject and replaces every assignment; with a commission it only covers
	 * that one (workshops) and keeps the other commission's teacher.
	 */
	assignTeacher(
		teacherId: string,
		commissionNumber: CommissionNumber | null = null,
	): void {
		this.setAssignment({ commissionNumber, teacherId });
	}

	/** Names a teacher who has no user account; an empty name leaves the subject (or commission) without teacher. */
	assignExternalTeacher(
		teacherName: string,
		commissionNumber: CommissionNumber | null = null,
	): void {
		this.setAssignment({ commissionNumber, teacherName });
	}

	/** Leaves the subject without any teacher. */
	unassignTeacher(): void {
		this._teachers = [];
		this._updatedAt = new Date();
	}

	/** Removes the teacher of a single commission. */
	unassignCommissionTeacher(commissionNumber: CommissionNumber): void {
		this._teachers = this._teachers.filter(
			(a) => a.commissionNumber !== commissionNumber,
		);
		this._updatedAt = new Date();
	}

	/** Replaces every assignment at once, validating the invariants. */
	replaceTeachers(assignments: SubjectTeacherAssignment[]): void {
		this._teachers = Subject.validateTeachers(this._kind, assignments);
		this._updatedAt = new Date();
	}

	/** Commissions this account teaches: 'all' for a whole-subject teacher, [] when none. */
	commissionsTaughtBy(teacherId: string): TaughtCommissions {
		const own = this._teachers.filter((a) => a.teacherId === teacherId);
		if (own.some((a) => a.commissionNumber === null)) return 'all';
		return own.map((a) => a.commissionNumber as CommissionNumber);
	}

	isTaughtBy(teacherId: string): boolean {
		const taught = this.commissionsTaughtBy(teacherId);
		return taught === 'all' || taught.length > 0;
	}

	private setAssignment(assignment: SubjectTeacherAssignment): void {
		const { commissionNumber } = assignment;
		if (commissionNumber === null) {
			this._teachers = Subject.validateTeachers(this._kind, [assignment]);
		} else {
			if (this._teachers.some((a) => a.commissionNumber === null)) {
				throw new DomainError(
					'La materia tiene un docente para todo el curso; reemplazá las asignaciones para definir docentes por comisión.',
				);
			}
			this._teachers = Subject.validateTeachers(this._kind, [
				...this._teachers.filter((a) => a.commissionNumber !== commissionNumber),
				assignment,
			]);
		}
		this._updatedAt = new Date();
	}

	updateDetails(
		name?: string,
		area?: string,
		weeklyHours?: number,
		kind?: SubjectKindType,
	): void {
		if (kind && kind !== SUBJECT_KIND.WORKSHOP && this.hasCommissionTeachers) {
			throw new DomainError(
				'No se puede cambiar el tipo de la materia mientras tenga docentes por comisión.',
			);
		}
		if (name) this._name = name;
		if (kind) this._kind = kind;
		if (area) this._area = area;
		if (weeklyHours !== undefined) {
			if (weeklyHours < 1)
				throw new DomainError('Las horas semanales deben ser al menos 1.');
			this._weeklyHours = weeklyHours;
		}
		this._updatedAt = new Date();
	}
	equals(otherSubject: Subject): boolean {
		return (
			this._area.trim().toLowerCase() === otherSubject.area.trim().toLowerCase() &&
			this.teachersKey() === otherSubject.teachersKey() &&
			this._name.trim().toLowerCase() === otherSubject.name.trim().toLowerCase() &&
			this._courseId === otherSubject.courseId
		);
	}
	private teachersKey(): string {
		return this._teachers
			.map((a) => `${a.commissionNumber ?? 0}:${a.teacherId ?? ''}`)
			.join('|');
	}
	softDelete() {
		this._deletedAt = new Date();
		this._updatedAt = new Date();
	}
}
