import {
	ACADEMIC_ROUTES,
	type CreateCourseFormValues,
	type CreateSubjectFormValues,
	type ICourseResponse,
	type ISubjectResponse,
	type IUserResponse,
	type IUserWithMembershipResponse,
	ROLES,
	type Roles,
} from '@repo/common';
import type {
	CreateCourseInput,
	CreateSubjectInput,
	UpdateCourseInput,
	UpdateSubjectInput,
} from '../store/types';

export const DEMO_COURSE_ROUTES = {
	new: `${ACADEMIC_ROUTES.courses}/create`,
	edit: (courseId: string) => `${ACADEMIC_ROUTES.course(courseId)}?edit=true`,
} as const;

export function getScopedCourseIds(
	courses: ICourseResponse[],
	subjects: ISubjectResponse[],
	userId: string | undefined,
	role: Roles | undefined,
): string[] | undefined {
	if (role === ROLES.ADMIN || role === ROLES.SUPERADMIN) return undefined;
	if (!userId) return [];

	if (role === ROLES.PRECEPTOR) {
		return courses
			.filter((course) => course.preceptorId === userId)
			.map((course) => course.id);
	}

	if (role === ROLES.TEACHER) {
		const courseIds = subjects
			.filter((subject) => subject.teacherId === userId)
			.map((subject) => subject.courseId)
			.filter((courseId): courseId is string => Boolean(courseId));
		return [...new Set(courseIds)];
	}

	return [];
}

export function getScopedSubjects(
	courses: ICourseResponse[],
	subjects: ISubjectResponse[],
	userId: string | undefined,
	role: Roles | undefined,
): ISubjectResponse[] {
	if (role === ROLES.ADMIN || role === ROLES.SUPERADMIN) return subjects;
	if (!userId) return [];

	if (role === ROLES.PRECEPTOR) {
		const courseIds = new Set(
			courses
				.filter((course) => course.preceptorId === userId)
				.map((course) => course.id),
		);
		return subjects.filter(
			(subject) => subject.courseId && courseIds.has(subject.courseId),
		);
	}

	if (role === ROLES.TEACHER) {
		return subjects.filter((subject) => subject.teacherId === userId);
	}

	return [];
}

export function toCourseFormDefaults(
	course: ICourseResponse,
): Partial<CreateCourseFormValues> {
	return {
		academicYearId: course.academicYearId ?? '',
		level: course.level,
		yearNumber: course.yearNumber,
		division: course.division,
		shift: course.shift,
		preceptorId: course.preceptorId ?? '',
	};
}

export function toSubjectFormDefaults(
	subject: ISubjectResponse,
): Partial<CreateSubjectFormValues> {
	return {
		name: subject.name,
		area: subject.area,
		weeklyHours: subject.weeklyHours,
		teacherId: subject.teacherId ?? '',
	};
}

export function toCreateCourseInput(
	values: CreateCourseFormValues,
): CreateCourseInput {
	const preceptorId = normalizeOptionalId(values.preceptorId);
	return {
		academicYearId: values.academicYearId,
		level: values.level,
		yearNumber: values.yearNumber,
		division: values.division,
		shift: values.shift,
		...(preceptorId ? { preceptorId } : {}),
	};
}

export function toUpdateCourseInput(
	values: CreateCourseFormValues,
): UpdateCourseInput {
	const preceptorId = normalizeOptionalId(values.preceptorId);
	return {
		level: values.level,
		yearNumber: values.yearNumber,
		division: values.division,
		shift: values.shift,
		...(preceptorId ? { preceptorId } : {}),
	};
}

export function toCreateSubjectInput(
	values: CreateSubjectFormValues,
): CreateSubjectInput {
	const teacherId = normalizeOptionalId(values.teacherId);
	return {
		courseId: values.courseId,
		name: values.name,
		area: values.area,
		weeklyHours: values.weeklyHours,
		...(teacherId ? { teacherId } : {}),
	};
}

export function toUpdateSubjectInput(
	values: CreateSubjectFormValues,
): UpdateSubjectInput {
	const teacherId = normalizeOptionalId(values.teacherId);
	return {
		courseId: values.courseId,
		name: values.name,
		area: values.area,
		weeklyHours: values.weeklyHours,
		...(teacherId ? { teacherId } : {}),
	};
}

export function toUserResponse(
	user: IUserWithMembershipResponse,
): IUserResponse {
	return {
		id: user.id,
		email: user.email,
		firstName: user.firstName,
		lastName: user.lastName,
		role: user.role,
		tenantId: user.tenantId ?? '',
		mustChangePassword: user.mustChangePassword,
	};
}

function normalizeOptionalId(value: string | undefined): string | undefined {
	const normalized = value?.trim();
	return normalized && normalized !== 'NONE' ? normalized : undefined;
}
