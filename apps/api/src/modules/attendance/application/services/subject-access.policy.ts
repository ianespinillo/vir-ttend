import { ForbiddenException } from '@nestjs/common';
import { ROLES, Roles } from '@repo/common';
import { Subject } from '../../domain/entities/subject.entity';

export interface SubjectActor {
	userId: string;
	role: Roles;
	tenantId?: string;
}

/**
 * Who may record or alter attendance of a subject: admins, and the teacher the
 * subject is assigned to. Preceptors and other teachers are rejected. Cross-tenant
 * access is always forbidden.
 */
export function assertCanWriteSubjectAttendance(
	subject: Subject,
	actor: SubjectActor,
): void {
	if (
		subject.tenantId &&
		actor.tenantId &&
		subject.tenantId !== actor.tenantId
	) {
		throw new ForbiddenException('Subject does not belong to your tenant');
	}
	if (actor.role === ROLES.ADMIN) return;
	if (actor.role === ROLES.TEACHER && subject.teacherId === actor.userId) return;
	throw new ForbiddenException(
		'You are not allowed to manage attendance for this subject',
	);
}

/**
 * Who may read attendance of a subject: everyone allowed to write it, plus
 * preceptors (they oversee the courses the subject belongs to). Cross-tenant
 * access is always forbidden.
 */
export function assertCanReadSubjectAttendance(
	subject: Subject,
	actor: SubjectActor,
): void {
	if (
		subject.tenantId &&
		actor.tenantId &&
		subject.tenantId !== actor.tenantId
	) {
		throw new ForbiddenException('Subject does not belong to your tenant');
	}
	if (actor.role === ROLES.PRECEPTOR) return;
	assertCanWriteSubjectAttendance(subject, actor);
}
