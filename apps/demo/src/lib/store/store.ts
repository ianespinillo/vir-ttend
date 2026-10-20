/**
 * Demo store — in-memory store + actions.
 *
 * createDemoStore() builds a self-contained store: a frozen-in-time DemoState
 * (loaded from persistence, or seeded), action handlers that mutate a cloned
 * state and persist it, and a subscribe()/getState() surface for React binding.
 *
 * Every mutation:
 *   1. structuredClone(state)      — never mutate the previous snapshot
 *   2. apply the change            — deterministically (ids via demoUuid, dates
 *                                     from DEMO_TODAY, never Date.now())
 *   3. commit: state = next, saveState(next), notify listeners
 *
 * Creation actions return the created entity (the provider hands it to the
 * calling layer, exactly like a mutation hook returning data).
 */

import {
	type ChangePasswordPayload,
	type CommissionCount,
	type CreateTenantPayload,
	type CreateUserPayload,
	type CreateUserResponse,
	type ICourseResponse,
	type IStudentImportRowData,
	type ISubjectResponse,
	ROLES,
	type Roles,
	SUBJECT_KIND,
	type ScheduleSlotFormValues,
	type Tenant,
	type UpdateUserPayload,
	WORKSHOP_ONLY_DAILY_ATTENDANCE_MESSAGE,
	isWorkshopOnlyCourse,
} from '@repo/common';
import { evaluateStudentAlert } from './alerts';
import {
	type MinimalStorage,
	clearPersistedState,
	getDefaultStorage,
	loadState,
	saveState,
} from './persistence';
import { createSeedState, demoUuid } from './seed-data';
import { getSubjectRoster } from './selectors';
import {
	type Announcement,
	type AttendanceEntry,
	type CopyAttendanceInput,
	type CreateAnnouncementInput,
	type CreateCourseInput,
	type CreateStudentInput,
	type CreateSubjectInput,
	DEMO_ACADEMIC_END,
	DEMO_ACADEMIC_START,
	DEMO_DEFAULT_PASSWORD,
	DEMO_TODAY,
	type DemoAttendanceRecord,
	type DemoState,
	type DemoStudent,
	type DemoUser,
	type DemoWorkshopCommission,
	type DemoWorkshopRecord,
	type JustifyInput,
	STUDENTSTATUS,
	type UpdateAnnouncementPayload,
	type UpdateCourseInput,
	type UpdateStudentInput,
	type UpdateSubjectInput,
	demoTodayDate,
} from './types';

// ---------------------------------------------------------------------------
// Store factory
// ---------------------------------------------------------------------------

export interface DemoStore {
	getState(): DemoState;
	subscribe(listener: () => void): () => void;

	// Session
	setSession(userId: string, tenantId?: string | null): void;
	clearSession(): void;
	resetDemoState(): DemoState;

	// Users
	createUser(payload: CreateUserPayload): CreateUserResponse;
	updateUser(userId: string, payload: UpdateUserPayload): DemoUser;
	changeRole(userId: string, role: Roles): DemoUser;
	toggleUserStatus(userId: string, isActive: boolean): DemoUser;
	resetPassword(userId: string): CreateUserResponse;
	changePassword(userId: string, payload: ChangePasswordPayload): void;

	// Tenants
	createTenant(payload: CreateTenantPayload): Tenant;
	updateTenant(
		tenantId: string,
		data: { name?: string; contactEmail?: string },
	): Tenant;
	toggleTenantStatus(tenantId: string, isActive: boolean): Tenant;

	// Students
	createStudent(input: CreateStudentInput): DemoStudent;
	updateStudent(studentId: string, input: UpdateStudentInput): DemoStudent;
	enrollStudent(studentId: string, courseId: string): DemoStudent;
	transferStudent(studentId: string, courseId?: string): DemoStudent;
	toggleStudentStatus(studentId: string, isActive: boolean): DemoStudent;

	// Courses & subjects
	createCourse(input: CreateCourseInput): ICourseResponse;
	updateCourse(courseId: string, input: UpdateCourseInput): ICourseResponse;
	createSubject(input: CreateSubjectInput): ISubjectResponse;
	updateSubject(subjectId: string, input: UpdateSubjectInput): ISubjectResponse;
	deleteSubject(subjectId: string): void;
	/** Replaces the whole weekly schedule of a course. */
	setSchedule(courseId: string, slots: ScheduleSlotFormValues[]): void;

	// Workshop commissions (technical courses)
	createWorkshopCommissions(
		courseId: string,
		count: CommissionCount,
	): DemoWorkshopCommission[];
	regenerateWorkshopCommissions(courseId: string): DemoWorkshopCommission[];
	assignCommissionPreceptor(
		commissionId: string,
		preceptorId: string | null,
	): DemoWorkshopCommission;
	moveStudentToCommission(commissionId: string, studentId: string): DemoStudent;
	registerWorkshopAttendance(
		commissionId: string,
		date: string,
		entries: AttendanceEntry[],
	): void;

	// Bulk import
	importStudents(courseId: string, rows: IStudentImportRowData[]): number;

	// Attendance
	markDailyAttendance(
		courseId: string,
		date: string,
		entries: AttendanceEntry[],
	): void;
	markSubjectAttendance(
		subjectId: string,
		courseId: string,
		date: string,
		entries: AttendanceEntry[],
	): void;
	markAllAttendance(
		courseId: string,
		date: string,
		status: AttendanceEntry['status'],
	): void;
	copyAttendance(input: CopyAttendanceInput): void;
	justifyAttendance(recordId: string, input: JustifyInput): DemoAttendanceRecord;

	// Alerts
	markAlertSeen(alertId: string): void;

	// Announcements
	createAnnouncement(input: CreateAnnouncementInput): Announcement;
	updateAnnouncement(
		announcementId: string,
		payload: UpdateAnnouncementPayload,
	): Announcement;
	publishAnnouncement(announcementId: string): Announcement;
	deleteAnnouncement(announcementId: string): void;
	markAnnouncementRead(announcementId: string, userId: string): void;

	// Academic
	declareNonWorkingDay(
		academicYearId: string,
		input: {
			date: string;
			reason: string;
			type?: string;
			notifySchool?: boolean;
			authorName?: string;
		},
	): void;
}

export function createDemoStore(
	initialState?: DemoState,
	storage: MinimalStorage | null = getDefaultStorage(),
): DemoStore {
	let state: DemoState = initialState ?? loadState(storage) ?? createSeedState();
	const listeners = new Set<() => void>();
	let idCounter = 1;

	function getState(): DemoState {
		return state;
	}

	function subscribe(listener: () => void): () => void {
		listeners.add(listener);
		return () => listeners.delete(listener);
	}

	function commit(next: DemoState): void {
		state = next;
		saveState(next, storage);
		for (const listener of listeners) listener();
	}

	function usedIds(): Set<string> {
		return new Set(
			[
				...state.users,
				...state.tenants,
				...state.students,
				...state.courses,
				...state.subjects,
				...state.schedules,
				...state.announcements,
				...state.workshopCommissions,
			].map((item) => item.id),
		);
	}

	function nextId(namespace: string): string {
		// The counter restarts on every page load: skip ids persisted earlier.
		const used = usedIds();
		let id = demoUuid(namespace, `created-${idCounter}`);
		idCounter += 1;
		while (used.has(id)) {
			id = demoUuid(namespace, `created-${idCounter}`);
			idCounter += 1;
		}
		return id;
	}

	function requireUser(userId: string): DemoUser {
		const user = state.users.find((item) => item.id === userId);
		if (!user) throw new Error(`Usuario no encontrado: ${userId}`);
		return user;
	}

	function requireStudent(studentId: string): DemoStudent {
		const student = state.students.find((item) => item.id === studentId);
		if (!student) throw new Error(`Estudiante no encontrado: ${studentId}`);
		return student;
	}

	function requireCourse(courseId: string): ICourseResponse {
		const course = state.courses.find((item) => item.id === courseId);
		if (!course) throw new Error(`Curso no encontrado: ${courseId}`);
		return course;
	}

	function requireTenant(tenantId: string): Tenant {
		const tenant = state.tenants.find((item) => item.id === tenantId);
		if (!tenant) throw new Error(`Institución no encontrada: ${tenantId}`);
		return tenant;
	}

	function withTenantName(user: DemoUser): DemoUser {
		const tenant = user.tenantId
			? state.tenants.find((t) => t.id === user.tenantId)
			: undefined;
		return { ...user, tenantName: tenant?.name };
	}

	// -------------------------------------------------------------------------
	// Session
	// -------------------------------------------------------------------------

	function setSession(userId: string, tenantId?: string | null): void {
		const user = requireUser(userId);
		const tenant = tenantId ?? user.tenantId ?? null;
		const next = structuredClone(state);
		next.session = { userId, tenantId: tenant ?? null };
		commit(next);
	}

	function clearSession(): void {
		const next = structuredClone(state);
		next.session = { userId: null, tenantId: null };
		commit(next);
	}

	function resetDemoState(): DemoState {
		clearPersistedState(storage);
		const fresh = createSeedState();
		commit(fresh);
		return fresh;
	}

	// -------------------------------------------------------------------------
	// Users
	// -------------------------------------------------------------------------

	function createUser(payload: CreateUserPayload): CreateUserResponse {
		const id = nextId('user');
		const user: DemoUser = {
			id,
			email: payload.email,
			firstName: payload.firstName,
			lastName: payload.lastName,
			role: (payload.role as Roles | undefined) ?? ROLES.ADMIN,
			tenantId: payload.tenantId,
			isActive: true,
			mustChangePassword: true,
			createdAt: demoTodayDate().toISOString(),
		};
		const next = structuredClone(state);
		next.users.push(withTenantName(user));
		commit(next);
		return {
			id,
			email: user.email,
			firstName: user.firstName,
			lastName: user.lastName,
			role: user.role,
			tenantId: user.tenantId,
			temporaryPassword: DEMO_DEFAULT_PASSWORD,
		};
	}

	function updateUser(userId: string, payload: UpdateUserPayload): DemoUser {
		const existing = requireUser(userId);
		const updated = withTenantName({ ...existing, ...payload });
		const next = structuredClone(state);
		replaceIn(next.users, updated);
		commit(next);
		return updated;
	}

	function changeRole(userId: string, role: Roles): DemoUser {
		const existing = requireUser(userId);
		const updated = withTenantName({ ...existing, role });
		const next = structuredClone(state);
		next.users = next.users.map((user) => (user.id === userId ? updated : user));
		commit(next);
		return updated;
	}

	function toggleUserStatus(userId: string, isActive: boolean): DemoUser {
		const existing = requireUser(userId);
		const updated = withTenantName({ ...existing, isActive });
		const next = structuredClone(state);
		next.users = next.users.map((user) => (user.id === userId ? updated : user));
		commit(next);
		return updated;
	}

	function resetPassword(userId: string): CreateUserResponse {
		const existing = requireUser(userId);
		const next = structuredClone(state);
		next.users = next.users.map((user) =>
			user.id === userId ? { ...user, mustChangePassword: true } : user,
		);
		commit(next);
		return {
			id: existing.id,
			email: existing.email,
			firstName: existing.firstName,
			lastName: existing.lastName,
			role: existing.role,
			tenantId: existing.tenantId,
			temporaryPassword: DEMO_DEFAULT_PASSWORD,
		};
	}

	function changePassword(userId: string, payload: ChangePasswordPayload): void {
		requireUser(userId);
		if (payload.oldPassword !== DEMO_DEFAULT_PASSWORD) {
			throw new Error('La contraseña actual es incorrecta');
		}
		if (payload.newPassword !== payload.confirmNewPassword) {
			throw new Error('Las contraseñas no coinciden');
		}
		const next = structuredClone(state);
		next.users = next.users.map((user) =>
			user.id === userId ? { ...user, mustChangePassword: false } : user,
		);
		commit(next);
	}

	// -------------------------------------------------------------------------
	// Tenants
	// -------------------------------------------------------------------------

	function createTenant(payload: CreateTenantPayload): Tenant {
		const tenant: Tenant = {
			id: nextId('tenant'),
			name: payload.name,
			subdomain: payload.subdomain,
			contactEmail: payload.contactEmail,
			isActive: true,
			createdAt: demoTodayDate(),
		};
		const next = structuredClone(state);
		next.tenants.push(tenant);
		commit(next);
		return tenant;
	}

	function updateTenant(
		tenantId: string,
		data: { name?: string; contactEmail?: string },
	): Tenant {
		requireTenant(tenantId);
		const next = structuredClone(state);
		next.tenants = next.tenants.map((tenant) =>
			tenant.id === tenantId
				? {
						...tenant,
						name: data.name ?? tenant.name,
						contactEmail: data.contactEmail ?? tenant.contactEmail,
					}
				: tenant,
		);
		commit(next);
		const updated = next.tenants.find((t) => t.id === tenantId);
		if (!updated) {
			throw new Error(`Sede no encontrada: ${tenantId}`);
		}
		return updated;
	}

	function toggleTenantStatus(tenantId: string, isActive: boolean): Tenant {
		requireTenant(tenantId);
		const next = structuredClone(state);
		next.tenants = next.tenants.map((tenant) =>
			tenant.id === tenantId ? { ...tenant, isActive } : tenant,
		);
		commit(next);
		const updatedTenant = next.tenants.find((tenant) => tenant.id === tenantId);
		if (!updatedTenant) {
			throw new Error(`Sede no encontrada: ${tenantId}`);
		}
		return updatedTenant;
	}

	// -------------------------------------------------------------------------
	// Students
	// -------------------------------------------------------------------------

	function createStudent(input: CreateStudentInput): DemoStudent {
		const course = requireCourse(input.courseId);
		const student: DemoStudent = {
			id: nextId('student'),
			fullName: `${input.firstName} ${input.lastName}`,
			firstName: input.firstName,
			lastName: input.lastName,
			documentNumber: input.documentNumber,
			birthDate: input.birthDate,
			age: 2026 - Number(input.birthDate.slice(0, 4)),
			courseId: input.courseId,
			courseName: course.fullName,
			status: STUDENTSTATUS.ACTIVE,
			tutorName: input.tutorName,
			tutorPhone: input.tutorPhone,
			tutorEmail: input.tutorEmail,
		};
		const next = structuredClone(state);
		placeNewStudent(next, student);
		next.students.push(student);
		commit(next);
		return student;
	}

	function updateStudent(
		studentId: string,
		input: UpdateStudentInput,
	): DemoStudent {
		const existing = requireStudent(studentId);
		const updated: DemoStudent = {
			...existing,
			...input,
			fullName: `${input.firstName ?? existing.firstName} ${input.lastName ?? existing.lastName}`,
			age:
				input.birthDate && input.birthDate !== existing.birthDate
					? 2026 - Number(input.birthDate.slice(0, 4))
					: existing.age,
		};
		const next = structuredClone(state);
		next.students = next.students.map((student) =>
			student.id === studentId ? updated : student,
		);
		commit(next);
		return updated;
	}

	function enrollStudent(studentId: string, courseId: string): DemoStudent {
		const current = requireStudent(studentId);
		const course = requireCourse(courseId);
		// Same rules as the API: no re-enrolling into the same course, and a
		// student already moved to another school cannot be enrolled.
		if (current.status === STUDENTSTATUS.TRANSFERRED) {
			throw new Error('El alumno fue trasladado a otra escuela.');
		}
		if (
			current.courseId === courseId &&
			current.status === STUDENTSTATUS.ACTIVE
		) {
			throw new Error('El alumno ya está matriculado en ese curso.');
		}
		const next = structuredClone(state);
		next.students = next.students.map((student) =>
			student.id === studentId
				? {
						...student,
						courseId,
						courseName: course.fullName,
						status: STUDENTSTATUS.ACTIVE,
						// The commission belongs to the old course: place again.
						workshopCommissionId:
							student.courseId === courseId ? student.workshopCommissionId : undefined,
					}
				: student,
		);
		const moved = next.students.find((student) => student.id === studentId);
		if (moved && !moved.workshopCommissionId) placeNewStudent(next, moved);
		commit(next);
		const updatedStudent = next.students.find(
			(student) => student.id === studentId,
		);
		if (!updatedStudent) {
			throw new Error(`Estudiante no encontrado: ${studentId}`);
		}
		return updatedStudent;
	}

	function transferStudent(studentId: string, courseId?: string): DemoStudent {
		const existing = requireStudent(studentId);
		if (existing.status !== STUDENTSTATUS.ACTIVE) {
			throw new Error('Solo se puede trasladar a un alumno activo.');
		}
		const targetCourse = courseId ? requireCourse(courseId) : null;
		const next = structuredClone(state);
		next.students = next.students.map((student) =>
			student.id === studentId
				? {
						...student,
						...(targetCourse
							? { courseId: targetCourse.id, courseName: targetCourse.fullName }
							: {}),
						status: STUDENTSTATUS.TRANSFERRED,
					}
				: student,
		);
		commit(next);
		const updatedStudent = next.students.find(
			(student) => student.id === studentId,
		);
		if (!updatedStudent) {
			throw new Error(`Estudiante no encontrado: ${studentId}`);
		}
		return updatedStudent;
	}

	function toggleStudentStatus(
		studentId: string,
		isActive: boolean,
	): DemoStudent {
		const existing = requireStudent(studentId);
		const next = structuredClone(state);
		next.students = next.students.map((student) =>
			student.id === studentId
				? {
						...student,
						status: isActive ? STUDENTSTATUS.ACTIVE : STUDENTSTATUS.INACTIVE,
					}
				: student,
		);
		commit(next);
		const updatedStudent = next.students.find(
			(student) => student.id === studentId,
		);
		if (!updatedStudent) {
			throw new Error(`Estudiante no encontrado: ${studentId}`);
		}
		return updatedStudent;
	}

	// -------------------------------------------------------------------------
	// Courses & subjects
	// -------------------------------------------------------------------------

	function createCourse(input: CreateCourseInput): ICourseResponse {
		const preceptor = input.preceptorId
			? requireUser(input.preceptorId)
			: undefined;
		const course: ICourseResponse = {
			id: nextId('course'),
			academicYearId: input.academicYearId,
			level: input.level,
			yearNumber: input.yearNumber,
			division: input.division,
			shift: input.shift,
			preceptorId: input.preceptorId,
			preceptorName: preceptor
				? `${preceptor.firstName} ${preceptor.lastName}`
				: undefined,
			fullName: `${input.yearNumber}º ${input.division}`,
		};
		const next = structuredClone(state);
		next.courses.push(course);
		commit(next);
		return course;
	}

	function updateCourse(
		courseId: string,
		input: UpdateCourseInput,
	): ICourseResponse {
		const existing = requireCourse(courseId);
		const preceptor =
			input.preceptorId !== undefined ? requireUser(input.preceptorId) : undefined;
		const merged: ICourseResponse = {
			...existing,
			...input,
			preceptorName: preceptor
				? `${preceptor.firstName} ${preceptor.lastName}`
				: existing.preceptorName,
			fullName: `${input.yearNumber ?? existing.yearNumber}º ${input.division ?? existing.division}`,
		};
		const next = structuredClone(state);
		next.courses = next.courses.map((course) =>
			course.id === courseId ? merged : course,
		);
		commit(next);
		return merged;
	}

	function createSubject(input: CreateSubjectInput): ISubjectResponse {
		const teacher = input.teacherId ? requireUser(input.teacherId) : undefined;
		const subject: ISubjectResponse = {
			id: nextId('subject'),
			courseId: input.courseId,
			name: input.name,
			area: input.area,
			weeklyHours: input.weeklyHours,
			kind: input.kind ?? SUBJECT_KIND.THEORY,
			teacherId: input.teacherId || undefined,
			// A teacher without an account is kept by name only.
			teacherName: teacher
				? `${teacher.firstName} ${teacher.lastName}`
				: input.teacherName?.trim() || undefined,
		};
		const next = structuredClone(state);
		next.subjects.push(subject);
		commit(next);
		return subject;
	}

	function updateSubject(
		subjectId: string,
		input: UpdateSubjectInput,
	): ISubjectResponse {
		const existing = state.subjects.find((item) => item.id === subjectId);
		if (!existing) throw new Error(`Materia no encontrada: ${subjectId}`);
		const teacher = input.teacherId ? requireUser(input.teacherId) : undefined;
		const clearsTeacher = input.teacherId === '';
		const merged: ISubjectResponse = {
			...existing,
			...input,
			teacherId: teacher
				? teacher.id
				: clearsTeacher
					? undefined
					: existing.teacherId,
			teacherName: teacher
				? `${teacher.firstName} ${teacher.lastName}`
				: input.teacherName !== undefined
					? input.teacherName.trim() || undefined
					: clearsTeacher
						? undefined
						: existing.teacherName,
		};
		const next = structuredClone(state);
		next.subjects = next.subjects.map((subject) =>
			subject.id === subjectId ? merged : subject,
		);
		commit(next);
		return merged;
	}

	function deleteSubject(subjectId: string): void {
		if (!state.subjects.some((subject) => subject.id === subjectId)) {
			throw new Error(`Materia no encontrada: ${subjectId}`);
		}
		const next = structuredClone(state);
		next.subjects = next.subjects.filter((subject) => subject.id !== subjectId);
		next.schedules = next.schedules.filter(
			(slot) => slot.subjectId !== subjectId,
		);
		next.attendance = next.attendance.filter(
			(record) => record.subjectId !== subjectId,
		);
		commit(next);
	}

	function setSchedule(courseId: string, slots: ScheduleSlotFormValues[]): void {
		requireCourse(courseId);
		const courseSubjectIds = new Set(
			state.subjects
				.filter((subject) => subject.courseId === courseId)
				.map((subject) => subject.id),
		);
		const next = structuredClone(state);
		next.schedules = next.schedules.filter(
			(slot) => !courseSubjectIds.has(slot.subjectId),
		);
		for (const [index, slot] of slots.entries()) {
			if (!courseSubjectIds.has(slot.subjectId)) continue;
			next.schedules.push({
				id: demoUuid(
					'schedule',
					`${courseId}:${slot.subjectId}:${slot.dayOfWeek}:${slot.startTime}:${slot.commissionNumber ?? 'all'}:${index}`,
				),
				subjectId: slot.subjectId,
				dayOfWeek: slot.dayOfWeek,
				startTime: slot.startTime,
				endTime: slot.endTime,
				commissionNumber: slot.commissionNumber ?? null,
			});
		}
		commit(next);
	}

	// -------------------------------------------------------------------------
	// Workshop commissions
	// -------------------------------------------------------------------------

	function createWorkshopCommissions(
		courseId: string,
		count: CommissionCount,
	): DemoWorkshopCommission[] {
		requireCourse(courseId);
		if (state.workshopCommissions.some((item) => item.courseId === courseId)) {
			throw new Error('El curso ya tiene comisiones de taller.');
		}
		const next = structuredClone(state);
		const created: DemoWorkshopCommission[] = ([1, 2] as const)
			.slice(0, count)
			.map((number) => ({
				id: demoUuid('commission', `${courseId}:${number}`),
				courseId,
				number,
				preceptorId: null,
			}));
		next.workshopCommissions.push(...created);
		applySplit(next, courseId);
		commit(next);
		return created;
	}

	function regenerateWorkshopCommissions(
		courseId: string,
	): DemoWorkshopCommission[] {
		requireCourse(courseId);
		if (!state.workshopCommissions.some((item) => item.courseId === courseId)) {
			throw new Error('El curso no tiene comisiones de taller.');
		}
		const next = structuredClone(state);
		applySplit(next, courseId);
		commit(next);
		return next.workshopCommissions.filter((item) => item.courseId === courseId);
	}

	function assignCommissionPreceptor(
		commissionId: string,
		preceptorId: string | null,
	): DemoWorkshopCommission {
		if (!state.workshopCommissions.some((item) => item.id === commissionId)) {
			throw new Error('Comisión no encontrada');
		}
		if (preceptorId) requireUser(preceptorId);
		const next = structuredClone(state);
		const commission = next.workshopCommissions.find(
			(item) => item.id === commissionId,
		) as DemoWorkshopCommission;
		commission.preceptorId = preceptorId;
		commit(next);
		return commission;
	}

	function moveStudentToCommission(
		commissionId: string,
		studentId: string,
	): DemoStudent {
		const commission = state.workshopCommissions.find(
			(item) => item.id === commissionId,
		);
		if (!commission) throw new Error('Comisión no encontrada');
		const student = requireStudent(studentId);
		if (student.courseId !== commission.courseId) {
			throw new Error('El estudiante no pertenece al curso de la comisión.');
		}
		if (student.status !== STUDENTSTATUS.ACTIVE) {
			throw new Error('El estudiante no está activo.');
		}
		const next = structuredClone(state);
		const target = next.students.find(
			(item) => item.id === studentId,
		) as DemoStudent;
		target.workshopCommissionId = commissionId;
		commit(next);
		return target;
	}

	function registerWorkshopAttendance(
		commissionId: string,
		date: string,
		entries: AttendanceEntry[],
	): void {
		const commission = state.workshopCommissions.find(
			(item) => item.id === commissionId,
		);
		if (!commission) throw new Error('Comisión no encontrada');
		const next = structuredClone(state);
		const members = new Map(
			next.students
				.filter(
					(student) =>
						student.workshopCommissionId === commissionId &&
						student.status === STUDENTSTATUS.ACTIVE,
				)
				.map((student) => [student.id, student]),
		);
		for (const entry of entries) {
			const student = members.get(entry.studentId);
			if (!student) continue; // outside the commission roster
			const existing = next.workshopAttendance.find(
				(record) =>
					record.commissionId === commissionId &&
					record.date === date &&
					record.studentId === entry.studentId,
			);
			if (existing) {
				existing.status = entry.status;
			} else {
				const record: DemoWorkshopRecord = {
					id: demoUuid('workshop-attendance', `${entry.studentId}:${date}`),
					commissionId,
					courseId: commission.courseId,
					studentId: entry.studentId,
					studentName: student.fullName,
					status: entry.status,
					date,
				};
				next.workshopAttendance.push(record);
			}
		}
		raiseAlerts(
			next,
			entries.map((entry) => entry.studentId),
		);
		commit(next);
	}

	// -------------------------------------------------------------------------
	// Bulk import
	// -------------------------------------------------------------------------

	function importStudents(
		courseId: string,
		rows: IStudentImportRowData[],
	): number {
		const course = requireCourse(courseId);
		const next = structuredClone(state);
		let created = 0;
		for (const row of rows) {
			const duplicate = next.students.some(
				(student) => student.documentNumber === row.documentNumber,
			);
			if (duplicate) continue;
			const student: DemoStudent = {
				id: nextIdFor(next, 'student'),
				fullName: `${row.firstName} ${row.lastName}`,
				firstName: row.firstName,
				lastName: row.lastName,
				documentNumber: row.documentNumber,
				birthDate: row.birthDate,
				age: 2026 - Number(row.birthDate.slice(0, 4)),
				courseId,
				courseName: course.fullName,
				status: STUDENTSTATUS.ACTIVE,
				tutorName: row.tutorName,
				tutorPhone: row.tutorPhone,
				tutorEmail: row.tutorEmail ?? undefined,
			};
			placeNewStudent(next, student);
			next.students.push(student);
			created += 1;
		}
		commit(next);
		return created;
	}

	// -------------------------------------------------------------------------
	// Attendance
	// -------------------------------------------------------------------------

	function markDailyAttendance(
		courseId: string,
		date: string,
		entries: AttendanceEntry[],
	): void {
		assertDailyAllowed(courseId);
		const next = structuredClone(state);
		for (const entry of entries) {
			upsertRecord(next, courseId, undefined, date, entry);
		}
		raiseAlerts(
			next,
			entries.map((entry) => entry.studentId),
		);
		commit(next);
	}

	function markSubjectAttendance(
		subjectId: string,
		courseId: string,
		date: string,
		entries: AttendanceEntry[],
	): void {
		requireCourse(courseId);
		const next = structuredClone(state);
		// The roster of a workshop subject is the commission(s) its slots target.
		const roster = new Set(
			getSubjectRoster(state, subjectId, date).map((student) => student.id),
		);
		for (const entry of entries) {
			if (!roster.has(entry.studentId)) continue;
			upsertRecord(next, courseId, subjectId, date, entry);
		}
		commit(next);
	}

	function markAllAttendance(
		courseId: string,
		date: string,
		status: AttendanceEntry['status'],
	): void {
		assertDailyAllowed(courseId);
		const next = structuredClone(state);
		const students = next.students.filter(
			(student) =>
				student.courseId === courseId && student.status === STUDENTSTATUS.ACTIVE,
		);
		for (const student of students) {
			upsertRecord(next, courseId, undefined, date, {
				studentId: student.id,
				status,
			});
		}
		raiseAlerts(
			next,
			students.map((student) => student.id),
		);
		commit(next);
	}

	function copyAttendance(input: CopyAttendanceInput): void {
		if (input.courseId) requireCourse(input.courseId);
		const sourceDate = input.sourceDate ?? previousSessionDate(state, input);
		if (!sourceDate || sourceDate >= input.targetDate) return;
		const next = structuredClone(state);
		const scopeRecords = next.attendance.filter((record) =>
			matchesScope(record, input),
		);
		const sourceRecords = scopeRecords.filter(
			(record) => record.date === sourceDate,
		);
		const roster = input.subjectId
			? new Set(
					getSubjectRoster(state, input.subjectId, input.targetDate).map(
						(student) => student.id,
					),
				)
			: null;
		const copied: string[] = [];
		for (const record of sourceRecords) {
			// A subject copy is limited to the subject's roster (commission).
			if (roster && !roster.has(record.studentId)) continue;
			upsertRecord(next, record.courseId, input.subjectId, input.targetDate, {
				studentId: record.studentId,
				status: record.status,
			});
			copied.push(record.studentId);
		}
		if (!input.subjectId) raiseAlerts(next, copied);
		commit(next);
	}

	function justifyAttendance(
		recordId: string,
		input: JustifyInput,
	): DemoAttendanceRecord {
		const next = structuredClone(state);
		const record = next.attendance.find((item) => item.id === recordId);
		if (!record)
			throw new Error(`Registro de asistencia no encontrado: ${recordId}`);
		record.status = 'justified';
		record.justification = {
			id: demoUuid('justification', recordId),
			reason: input.reason,
			notes: input.notes,
			createdBy: currentUserName(next),
			createdAt: demoTodayDate(),
		};
		// Justified absences still count: a daily record may cross a threshold.
		if (!record.subjectId) raiseAlerts(next, [record.studentId]);
		commit(next);
		return record;
	}

	// -------------------------------------------------------------------------
	// Alerts
	// -------------------------------------------------------------------------

	function markAlertSeen(alertId: string): void {
		const next = structuredClone(state);
		const alert = next.alerts.find((item) => item.id === alertId);
		if (!alert) return;
		alert.seenAt = demoTodayDate();
		commit(next);
	}

	// -------------------------------------------------------------------------
	// Announcements
	// -------------------------------------------------------------------------

	function createAnnouncement(input: CreateAnnouncementInput): Announcement {
		const announcement: Announcement = {
			id: nextId('announcement'),
			title: input.title,
			body: input.body,
			targetType: input.targetType,
			targetId: input.targetId ?? '',
			status: 'draft',
			publishAt: input.publishAt ?? null,
			authorName: input.authorName,
			createdAt: demoTodayDate().toISOString(),
		};
		const next = structuredClone(state);
		next.announcements.push(announcement);
		commit(next);
		return announcement;
	}

	function updateAnnouncement(
		announcementId: string,
		payload: UpdateAnnouncementPayload,
	): Announcement {
		const existing = state.announcements.find(
			(item) => item.id === announcementId,
		);
		if (!existing) throw new Error(`Comunicado no encontrado: ${announcementId}`);
		const next = structuredClone(state);
		next.announcements = next.announcements.map((item) =>
			item.id === announcementId ? { ...item, ...payload } : item,
		);
		commit(next);
		const updated = next.announcements.find((item) => item.id === announcementId);
		if (!updated) {
			throw new Error(`Comunicado no encontrado: ${announcementId}`);
		}
		return updated;
	}

	function publishAnnouncement(announcementId: string): Announcement {
		const existing = state.announcements.find(
			(item) => item.id === announcementId,
		);
		if (!existing) throw new Error(`Comunicado no encontrado: ${announcementId}`);
		const next = structuredClone(state);
		next.announcements = next.announcements.map((item) =>
			item.id === announcementId
				? {
						...item,
						status: 'published',
						publishAt: item.publishAt ?? demoTodayDate().toISOString(),
					}
				: item,
		);
		commit(next);
		const updated = next.announcements.find((item) => item.id === announcementId);
		if (!updated) {
			throw new Error(`Comunicado no encontrado: ${announcementId}`);
		}
		return updated;
	}

	function deleteAnnouncement(announcementId: string): void {
		const next = structuredClone(state);
		next.announcements = next.announcements.filter(
			(item) => item.id !== announcementId,
		);
		commit(next);
	}

	function markAnnouncementRead(announcementId: string, userId: string): void {
		const next = structuredClone(state);
		const reads = next.announcementReads[userId] ?? [];
		if (!reads.includes(announcementId)) {
			next.announcementReads[userId] = [...reads, announcementId];
		}
		commit(next);
	}

	function declareNonWorkingDay(
		academicYearId: string,
		input: {
			date: string;
			reason: string;
			type?: string;
			notifySchool?: boolean;
			authorName?: string;
		},
	): void {
		const targetDate = new Date(input.date);
		const next = structuredClone(state);
		next.academicYears = next.academicYears.map((ay) => {
			if (ay.id !== academicYearId) return ay;
			const exists = (ay.nonWorkingDays ?? []).some(
				(d) => new Date(d).getTime() === targetDate.getTime(),
			);
			return {
				...ay,
				nonWorkingDays: exists
					? ay.nonWorkingDays
					: [...(ay.nonWorkingDays ?? []), targetDate],
			};
		});
		commit(next);

		if (input.notifySchool !== false) {
			const formattedDate = targetDate.toLocaleDateString('es-AR', {
				day: '2-digit',
				month: '2-digit',
				year: 'numeric',
				timeZone: 'UTC',
			});
			const announcement = createAnnouncement({
				title: `Suspensión de actividades — ${input.reason}`,
				body: `Se informa a toda la comunidad educativa que el día ${formattedDate} no habrá dictado de clases ni actividades escolares debido a: ${input.reason}. El día ha sido registrado como no laborable en el calendario académico institucional.`,
				targetType: 'school',
				targetId: '',
				authorName: input.authorName ?? 'Equipo Directivo',
			});
			publishAnnouncement(announcement.id);
		}
	}

	// -------------------------------------------------------------------------
	// Internal helpers
	// -------------------------------------------------------------------------

	function assertDailyAllowed(courseId: string): void {
		const course = requireCourse(courseId);
		if (isWorkshopOnlyCourse(course)) {
			throw new Error(WORKSHOP_ONLY_DAILY_ATTENDANCE_MESSAGE);
		}
	}

	/** Raises the absence alerts the weighted count of each student reached. */
	function raiseAlerts(next: DemoState, studentIds: Iterable<string>): void {
		for (const studentId of new Set(studentIds)) {
			const alert = evaluateStudentAlert(
				next,
				studentId,
				demoTodayDate(),
				(id, type) => demoUuid('alert', `${id}:${type}`),
			);
			if (alert) next.alerts.push(alert);
		}
	}

	function nextIdFor(draft: DemoState, namespace: string): string {
		const used = new Set(draft.students.map((student) => student.id));
		let id = demoUuid(namespace, `created-${idCounter}`);
		idCounter += 1;
		while (used.has(id)) {
			id = demoUuid(namespace, `created-${idCounter}`);
			idCounter += 1;
		}
		return id;
	}

	/**
	 * Alphabetical split of the course's active students over its commissions
	 * (50/50 with two, everyone together with one).
	 */
	function applySplit(draft: DemoState, courseId: string): void {
		const commissions = draft.workshopCommissions
			.filter((item) => item.courseId === courseId)
			.sort((a, b) => a.number - b.number);
		if (commissions.length === 0) return;
		const roster = draft.students
			.filter(
				(student) =>
					student.courseId === courseId && student.status === STUDENTSTATUS.ACTIVE,
			)
			.sort(
				(a, b) =>
					a.lastName.localeCompare(b.lastName, 'es', { sensitivity: 'base' }) ||
					a.firstName.localeCompare(b.firstName, 'es', { sensitivity: 'base' }),
			);
		const cut =
			commissions.length === 1 ? roster.length : Math.ceil(roster.length / 2);
		roster.forEach((student, index) => {
			const commission = index < cut ? commissions[0] : commissions[1];
			student.workshopCommissionId = commission?.id;
		});
	}

	/**
	 * A student joining a course with commissions goes to the one with fewer
	 * active students (ties to commission 1); courses without commissions leave
	 * the student unassigned.
	 */
	function placeNewStudent(draft: DemoState, student: DemoStudent): void {
		const commissions = draft.workshopCommissions
			.filter((item) => item.courseId === student.courseId)
			.sort((a, b) => a.number - b.number);
		const [first, second] = commissions;
		if (!first) {
			student.workshopCommissionId = undefined;
			return;
		}
		const sizeOf = (commissionId: string) =>
			draft.students.filter(
				(item) =>
					item.id !== student.id &&
					item.workshopCommissionId === commissionId &&
					item.status === STUDENTSTATUS.ACTIVE,
			).length;
		student.workshopCommissionId =
			second && sizeOf(second.id) < sizeOf(first.id) ? second.id : first.id;
	}

	function upsertRecord(
		next: DemoState,
		courseId: string,
		subjectId: string | undefined,
		date: string,
		entry: AttendanceEntry,
	): void {
		const student = next.students.find((item) => item.id === entry.studentId);
		if (!student) return;
		const existing = next.attendance.find(
			(record) =>
				record.courseId === courseId &&
				record.date === date &&
				record.studentId === entry.studentId &&
				record.subjectId === subjectId,
		);
		if (existing) {
			existing.status = entry.status;
			if (entry.status !== 'justified') {
				existing.justification = undefined;
			}
		} else {
			next.attendance.push({
				id: demoUuid(
					'attendance',
					`${entry.studentId}:${date}:${subjectId ?? 'daily'}`,
				),
				studentId: entry.studentId,
				studentName: student.fullName,
				status: entry.status,
				courseId,
				subjectId,
				date,
			});
		}
	}

	function matchesScope(
		record: DemoAttendanceRecord,
		input: CopyAttendanceInput,
	): boolean {
		if (input.courseId && record.courseId !== input.courseId) return false;
		if (input.subjectId !== undefined && record.subjectId !== input.subjectId)
			return false;
		if (input.subjectId === undefined && record.subjectId !== undefined)
			return false;
		return true;
	}

	function previousSessionDate(
		currentState: DemoState,
		input: CopyAttendanceInput,
	): string | undefined {
		const scopeDates = currentState.attendance
			.filter(
				(record) => matchesScope(record, input) && record.date < input.targetDate,
			)
			.map((record) => record.date);
		const unique = [...new Set(scopeDates)].sort();
		return unique.at(-1);
	}

	function currentUserName(currentState: DemoState): string {
		const user = currentState.users.find(
			(item) => item.id === currentState.session.userId,
		);
		return user ? `${user.firstName} ${user.lastName}` : 'Demo';
	}

	function replaceIn(users: DemoUser[], updated: DemoUser): void {
		const index = users.findIndex((user) => user.id === updated.id);
		if (index >= 0) users[index] = updated;
	}

	return {
		getState,
		subscribe,
		setSession,
		clearSession,
		resetDemoState,
		createUser,
		updateUser,
		changeRole,
		toggleUserStatus,
		resetPassword,
		changePassword,
		createTenant,
		updateTenant,
		toggleTenantStatus,
		createStudent,
		updateStudent,
		enrollStudent,
		transferStudent,
		toggleStudentStatus,
		createCourse,
		updateCourse,
		createSubject,
		updateSubject,
		deleteSubject,
		setSchedule,
		createWorkshopCommissions,
		regenerateWorkshopCommissions,
		assignCommissionPreceptor,
		moveStudentToCommission,
		registerWorkshopAttendance,
		importStudents,
		markDailyAttendance,
		markSubjectAttendance,
		markAllAttendance,
		copyAttendance,
		justifyAttendance,
		markAlertSeen,
		createAnnouncement,
		updateAnnouncement,
		publishAnnouncement,
		deleteAnnouncement,
		markAnnouncementRead,
		declareNonWorkingDay,
	};
}

// ---------------------------------------------------------------------------
// Singleton accessor (the DemoProvider creates its own instance; this is a
// convenience for tests and non-provider callers).
// ---------------------------------------------------------------------------

let singleton: DemoStore | null = null;

export function getDemoStore(): DemoStore {
	singleton ??= createDemoStore();
	return singleton;
}

// Constants re-exported for pages that reference the academic window.
export { DEMO_ACADEMIC_END, DEMO_ACADEMIC_START, DEMO_TODAY };
