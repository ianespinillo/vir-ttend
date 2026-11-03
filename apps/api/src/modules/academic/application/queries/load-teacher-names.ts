import { IUserRepository } from '../../../identity/domain/repositories/user.repository.interface';
import { Subject } from '../../domain/entities/subject.entity';

/** Display names of every account teaching any of the subjects, by user id. */
export async function loadTeacherNames(
	userRepo: IUserRepository,
	subjects: Subject[],
): Promise<Map<string, string>> {
	const teacherIds = Array.from(new Set(subjects.flatMap((s) => s.teacherIds)));
	if (teacherIds.length === 0) return new Map();
	const teachers = await userRepo.findByIds(teacherIds);
	return new Map(teachers.map((t) => [t.id, t.fullName]));
}
