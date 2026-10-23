import { ForbiddenException } from '@nestjs/common';
import { ROLES } from '@repo/common';
import { Course } from '../../domain/entities/course.entity';

/**
 * Preceptors may reorganize workshop commissions only for the course they are
 * in charge of, which includes assigning the commission preceptors.
 */
export function assertCanManageCommissions(
	course: Course,
	actorId?: string,
	actorRole?: string,
): void {
	if (actorRole !== ROLES.PRECEPTOR) return;
	if (!actorId || course.preceptorId !== actorId)
		throw new ForbiddenException(
			'Solo el preceptor del curso puede gestionar sus comisiones.',
		);
}
