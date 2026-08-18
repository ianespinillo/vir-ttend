import 'reflect-metadata';
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { MikroORM, defineConfig } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import {
	type AttendanceStatus,
	DAYOFWEEK,
	LEVEL,
	ROLES,
	SHIFT,
	STUDENTSTATUS,
	type StudentStatus,
} from '@repo/common';
import { hash as bcryptHash } from 'bcryptjs';

import { AcademicYearOrmEntity } from '../src/modules/academic/infrastructure/persistence/entities/academic-year.orm-entity';
import { CourseOrmEntity } from '../src/modules/academic/infrastructure/persistence/entities/courses.orm-entity';
import { ScheduleSlotOrmEntity } from '../src/modules/academic/infrastructure/persistence/entities/schedule-slot.orm-entity';
import { StudentOrmEntity } from '../src/modules/academic/infrastructure/persistence/entities/student.orm-entity';
import { SubjectOrmEntity } from '../src/modules/academic/infrastructure/persistence/entities/subject.orm-entity';
import { AttendanceAlertOrmEntity } from '../src/modules/attendance/infrastructure/persistence/entities/attendance-alert.orm-entity';
import { AttendanceRecordOrmEntity } from '../src/modules/attendance/infrastructure/persistence/entities/attendance-record.orm-entity';
import { JustificationOrmEntity } from '../src/modules/attendance/infrastructure/persistence/entities/justification.orm-entity';
import { AnnouncementOrmEntity } from '../src/modules/identity/infrastructure/persistence/entities/announcement.orm-entity';
import { TenantOrmEntity } from '../src/modules/identity/infrastructure/persistence/entities/tenant.orm-entity';
import { UserTenantMembershipOrmEntity } from '../src/modules/identity/infrastructure/persistence/entities/user-tenant-membership.orm-entity';
import { UserOrmEntity } from '../src/modules/identity/infrastructure/persistence/entities/user.orm-entity';
import type { IMonthlyReportData } from '../src/modules/reporting/domain/types/monthly-report-data.type';
import type { StudentReportEntry } from '../src/modules/reporting/domain/types/student-report-entry.type';
import { MonthlyReportOrmEntity } from '../src/modules/reporting/infrastructure/persistence/entities/monthly-report.orm-entity';

type AbsenceProfile =
	| 'perfect'
	| 'normal'
	| 'some-absences'
	| 'many-late'
	| 'warning'
	| 'critical'
	| 'exceeded';

type UserKey =
	| 'superadmin'
	| 'admin'
	| 'preceptor1'
	| 'preceptor2'
	| 'teacher1'
	| 'teacher2'
	| 'teacher3'
	| 'teacher4';

interface SeedUser {
	key: UserKey;
	email: string;
	password: string;
	firstName: string;
	lastName: string;
	role: (typeof ROLES)[keyof typeof ROLES] | null;
}

interface SeedSlot {
	day: DAYOFWEEK;
	start: string;
	end: string;
}

interface SeedSubject {
	name: string;
	area: string;
	weeklyHours: number;
	teacherKey: UserKey;
	slots: SeedSlot[];
}

interface SeedStudent {
	firstName: string;
	lastName: string;
	dni: string;
	birthDate: string;
	tutorName: string;
	tutorPhone: string;
	tutorEmail?: string;
	profile: AbsenceProfile;
	status?: StudentStatus;
}

interface SeedCourse {
	key: string;
	level: (typeof LEVEL)[keyof typeof LEVEL];
	yearNumber: number;
	divisionLetter: string;
	shift: (typeof SHIFT)[keyof typeof SHIFT];
	preceptorKey: UserKey;
	subjects: SeedSubject[];
	students: SeedStudent[];
}

const USER_PASSWORD = 'DemoPass1!';
const SUPERADMIN_PASSWORD = 'Superadmin1!';

const HOLIDAYS_2026 = [
	'2026-01-01',
	'2026-02-16',
	'2026-03-24',
	'2026-04-02',
	'2026-04-03',
	'2026-05-01',
	'2026-05-25',
	'2026-06-20',
	'2026-07-09',
	'2026-08-17',
	'2026-10-12',
	'2026-11-20',
	'2026-12-08',
	'2026-12-25',
];

const USERS: SeedUser[] = [
	{
		key: 'superadmin',
		email: 'superadmin@virttend.demo',
		password: SUPERADMIN_PASSWORD,
		firstName: 'Carlos',
		lastName: 'Ramos',
		role: null,
	},
	{
		key: 'admin',
		email: 'admin@colegio.demo',
		password: USER_PASSWORD,
		firstName: 'Ana',
		lastName: 'Gómez',
		role: ROLES.ADMIN,
	},
	{
		key: 'preceptor1',
		email: 'preceptor1@colegio.demo',
		password: USER_PASSWORD,
		firstName: 'Roberto',
		lastName: 'López',
		role: ROLES.PRECEPTOR,
	},
	{
		key: 'preceptor2',
		email: 'preceptor2@colegio.demo',
		password: USER_PASSWORD,
		firstName: 'Laura',
		lastName: 'Martínez',
		role: ROLES.PRECEPTOR,
	},
	{
		key: 'teacher1',
		email: 'teacher1@colegio.demo',
		password: USER_PASSWORD,
		firstName: 'Javier',
		lastName: 'Pérez',
		role: ROLES.TEACHER,
	},
	{
		key: 'teacher2',
		email: 'teacher2@colegio.demo',
		password: USER_PASSWORD,
		firstName: 'Elena',
		lastName: 'Fernández',
		role: ROLES.TEACHER,
	},
	{
		key: 'teacher3',
		email: 'teacher3@colegio.demo',
		password: USER_PASSWORD,
		firstName: 'Pedro',
		lastName: 'Sosa',
		role: ROLES.TEACHER,
	},
	{
		key: 'teacher4',
		email: 'teacher4@colegio.demo',
		password: USER_PASSWORD,
		firstName: 'María',
		lastName: 'Ruiz',
		role: ROLES.TEACHER,
	},
];

const COURSES: SeedCourse[] = [
	{
		key: '6A',
		level: LEVEL.PRIMARY,
		yearNumber: 6,
		divisionLetter: 'A',
		shift: SHIFT.MORNING,
		preceptorKey: 'preceptor1',
		subjects: [
			{
				name: 'Lengua',
				area: 'Lengua',
				weeklyHours: 5,
				teacherKey: 'teacher1',
				slots: [
					{ day: DAYOFWEEK.MONDAY, start: '08:00', end: '09:20' },
					{ day: DAYOFWEEK.WEDNESDAY, start: '08:00', end: '09:20' },
				],
			},
			{
				name: 'Matemática',
				area: 'Matemática',
				weeklyHours: 5,
				teacherKey: 'teacher2',
				slots: [
					{ day: DAYOFWEEK.TUESDAY, start: '08:00', end: '09:20' },
					{ day: DAYOFWEEK.THURSDAY, start: '08:00', end: '09:20' },
				],
			},
			{
				name: 'Ciencias Naturales',
				area: 'Ciencias Naturales',
				weeklyHours: 3,
				teacherKey: 'teacher3',
				slots: [{ day: DAYOFWEEK.FRIDAY, start: '08:00', end: '09:20' }],
			},
			{
				name: 'Ciencias Sociales',
				area: 'Ciencias Sociales',
				weeklyHours: 3,
				teacherKey: 'teacher3',
				slots: [{ day: DAYOFWEEK.MONDAY, start: '09:30', end: '10:50' }],
			},
			{
				name: 'Inglés',
				area: 'Idiomas',
				weeklyHours: 3,
				teacherKey: 'teacher4',
				slots: [{ day: DAYOFWEEK.THURSDAY, start: '09:30', end: '10:50' }],
			},
		],
		students: [
			{
				firstName: 'Joaquín',
				lastName: 'Díaz',
				dni: '45120001',
				birthDate: '2014-02-11',
				tutorName: 'María Díaz',
				tutorPhone: '+54 11 5555-2001',
				profile: 'exceeded',
			},
			{
				firstName: 'Santiago',
				lastName: 'Paz',
				dni: '45120002',
				birthDate: '2013-11-05',
				tutorName: 'Ricardo Paz',
				tutorPhone: '+54 11 5555-2002',
				profile: 'critical',
			},
			{
				firstName: 'Sofía',
				lastName: 'Rossi',
				dni: '45120003',
				birthDate: '2014-05-23',
				tutorName: 'Lucía Rossi',
				tutorPhone: '+54 11 5555-2003',
				profile: 'warning',
			},
			{
				firstName: 'Martín',
				lastName: 'Benítez',
				dni: '45120004',
				birthDate: '2014-01-30',
				tutorName: 'Gabriel Benítez',
				tutorPhone: '+54 11 5555-2004',
				profile: 'perfect',
			},
			{
				firstName: 'Lucía',
				lastName: 'Morales',
				dni: '45120005',
				birthDate: '2014-07-14',
				tutorName: 'Carla Morales',
				tutorPhone: '+54 11 5555-2005',
				profile: 'many-late',
			},
			{
				firstName: 'Mateo',
				lastName: 'Giménez',
				dni: '45120006',
				birthDate: '2013-10-02',
				tutorName: 'Daniela Giménez',
				tutorPhone: '+54 11 5555-2006',
				profile: 'some-absences',
			},
			{
				firstName: 'Camila',
				lastName: 'Torres',
				dni: '45120007',
				birthDate: '2014-08-19',
				tutorName: 'Hugo Torres',
				tutorPhone: '+54 11 5555-2007',
				profile: 'normal',
			},
			{
				firstName: 'Franco',
				lastName: 'Vidal',
				dni: '45120008',
				birthDate: '2014-03-09',
				tutorName: 'Marta Vidal',
				tutorPhone: '+54 11 5555-2008',
				profile: 'normal',
			},
			{
				firstName: 'Bruno',
				lastName: 'Salazar',
				dni: '45120009',
				birthDate: '2014-06-27',
				tutorName: 'Elena Salazar',
				tutorPhone: '+54 11 5555-2009',
				profile: 'normal',
				status: STUDENTSTATUS.INACTIVE,
			},
			{
				firstName: 'Delfina',
				lastName: 'Ibarra',
				dni: '45120010',
				birthDate: '2013-12-12',
				tutorName: 'Sergio Ibarra',
				tutorPhone: '+54 11 5555-2010',
				profile: 'normal',
				status: STUDENTSTATUS.TRANSFERRED,
			},
		],
	},
	{
		key: '1A',
		level: LEVEL.SECONDARY,
		yearNumber: 1,
		divisionLetter: 'A',
		shift: SHIFT.AFTERNOON,
		preceptorKey: 'preceptor2',
		subjects: [
			{
				name: 'Lengua y Literatura',
				area: 'Lengua',
				weeklyHours: 4,
				teacherKey: 'teacher1',
				slots: [
					{ day: DAYOFWEEK.MONDAY, start: '13:00', end: '14:20' },
					{ day: DAYOFWEEK.WEDNESDAY, start: '13:00', end: '14:20' },
				],
			},
			{
				name: 'Matemática',
				area: 'Matemática',
				weeklyHours: 4,
				teacherKey: 'teacher2',
				slots: [
					{ day: DAYOFWEEK.TUESDAY, start: '13:00', end: '14:20' },
					{ day: DAYOFWEEK.THURSDAY, start: '13:00', end: '14:20' },
				],
			},
			{
				name: 'Historia',
				area: 'Ciencias Sociales',
				weeklyHours: 3,
				teacherKey: 'teacher4',
				slots: [
					{ day: DAYOFWEEK.WEDNESDAY, start: '14:30', end: '15:50' },
					{ day: DAYOFWEEK.FRIDAY, start: '13:00', end: '14:20' },
				],
			},
		],
		students: [
			{
				firstName: 'Juan',
				lastName: 'Pérez',
				dni: '46110001',
				birthDate: '2010-04-15',
				tutorName: 'Silvia Pérez',
				tutorPhone: '+54 11 5555-3001',
				profile: 'some-absences',
			},
			{
				firstName: 'Ana',
				lastName: 'Sosa',
				dni: '46110002',
				birthDate: '2010-09-21',
				tutorName: 'Oscar Sosa',
				tutorPhone: '+54 11 5555-3002',
				profile: 'perfect',
			},
			{
				firstName: 'Micaela',
				lastName: 'Ríos',
				dni: '46110003',
				birthDate: '2010-02-08',
				tutorName: 'Paula Ríos',
				tutorPhone: '+54 11 5555-3003',
				profile: 'normal',
			},
			{
				firstName: 'Tomás',
				lastName: 'Luna',
				dni: '46110004',
				birthDate: '2010-07-17',
				tutorName: 'Raúl Luna',
				tutorPhone: '+54 11 5555-3004',
				profile: 'warning',
			},
			{
				firstName: 'Florencia',
				lastName: 'Vega',
				dni: '46110005',
				birthDate: '2009-11-30',
				tutorName: 'Natalia Vega',
				tutorPhone: '+54 11 5555-3005',
				profile: 'critical',
			},
			{
				firstName: 'Pedro',
				lastName: 'Díaz',
				dni: '46110006',
				birthDate: '2010-05-03',
				tutorName: 'Marcelo Díaz',
				tutorPhone: '+54 11 5555-3006',
				profile: 'normal',
			},
			{
				firstName: 'Ignacio',
				lastName: 'Roldán',
				dni: '46110007',
				birthDate: '2010-01-25',
				tutorName: 'Andrea Roldán',
				tutorPhone: '+54 11 5555-3007',
				profile: 'normal',
			},
		],
	},
	{
		key: '4B',
		level: LEVEL.SECONDARY,
		yearNumber: 4,
		divisionLetter: 'B',
		shift: SHIFT.MORNING,
		preceptorKey: 'preceptor2',
		subjects: [
			{
				name: 'Lengua y Literatura',
				area: 'Lengua',
				weeklyHours: 5,
				teacherKey: 'teacher1',
				slots: [
					{ day: DAYOFWEEK.MONDAY, start: '08:00', end: '09:20' },
					{ day: DAYOFWEEK.WEDNESDAY, start: '08:00', end: '09:20' },
				],
			},
			{
				name: 'Matemática',
				area: 'Matemática',
				weeklyHours: 5,
				teacherKey: 'teacher2',
				slots: [
					{ day: DAYOFWEEK.TUESDAY, start: '08:00', end: '09:20' },
					{ day: DAYOFWEEK.THURSDAY, start: '08:00', end: '09:20' },
				],
			},
			{
				name: 'Historia',
				area: 'Ciencias Sociales',
				weeklyHours: 3,
				teacherKey: 'teacher4',
				slots: [
					{ day: DAYOFWEEK.FRIDAY, start: '08:00', end: '09:20' },
					{ day: DAYOFWEEK.THURSDAY, start: '09:30', end: '10:50' },
				],
			},
		],
		students: [
			{
				firstName: 'Ema',
				lastName: 'Acosta',
				dni: '47120001',
				birthDate: '2012-06-12',
				tutorName: 'Fernando Acosta',
				tutorPhone: '+54 11 5555-4001',
				profile: 'normal',
			},
			{
				firstName: 'Bruno',
				lastName: 'Quiroga',
				dni: '47120002',
				birthDate: '2012-03-28',
				tutorName: 'Verónica Quiroga',
				tutorPhone: '+54 11 5555-4002',
				profile: 'normal',
			},
			{
				firstName: 'Martina',
				lastName: 'Cáceres',
				dni: '47120003',
				birthDate: '2012-10-04',
				tutorName: 'Javier Cáceres',
				tutorPhone: '+54 11 5555-4003',
				profile: 'normal',
			},
			{
				firstName: 'Thiago',
				lastName: 'Silva',
				dni: '47120004',
				birthDate: '2012-01-19',
				tutorName: 'Lorena Silva',
				tutorPhone: '+54 11 5555-4004',
				profile: 'normal',
			},
			{
				firstName: 'Agustín',
				lastName: 'Herrera',
				dni: '47120005',
				birthDate: '2012-08-30',
				tutorName: 'Diego Herrera',
				tutorPhone: '+54 11 5555-4005',
				profile: 'normal',
			},
		],
	},
];

const PROFILE_RATES: Record<AbsenceProfile, { absent: number; late: number }> =
	{
		perfect: { absent: 0, late: 0 },
		normal: { absent: 0.06, late: 0.07 },
		'some-absences': { absent: 0.25, late: 0.05 },
		'many-late': { absent: 0.05, late: 0.5 },
		warning: { absent: 0.55, late: 0.06 },
		critical: { absent: 0.8, late: 0.03 },
		exceeded: { absent: 1, late: 0 },
	};

const DAY_INDEX: Record<string, number> = {
	monday: 1,
	tuesday: 2,
	wednesday: 3,
	thursday: 4,
	friday: 5,
};

function hashString(input: string): number {
	let h = 0;
	for (let i = 0; i < input.length; i++) {
		h = (h * 31 + input.charCodeAt(i)) | 0;
	}
	return Math.abs(h);
}

function mulberry32(seed: number): () => number {
	let state = seed;
	return function next() {
		state = (state + 0x6d2b79f5) | 0;
		let t = Math.imul(state ^ (state >>> 15), 1 | state);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function pickStatus(
	profile: AbsenceProfile,
	rnd: () => number,
): AttendanceStatus {
	const rates = PROFILE_RATES[profile];
	const roll = rnd();
	if (roll < rates.absent) return 'absent';
	if (roll < rates.absent + rates.late) return 'late';
	return 'present';
}

function toLocalDate(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
	const copy = new Date(date);
	copy.setDate(copy.getDate() + days);
	return copy;
}

function isBusinessDay(date: Date, holidays: Set<string>): boolean {
	const day = date.getDay();
	if (day === 0 || day === 6) return false;
	return !holidays.has(toLocalDate(date));
}

function lastBusinessDays(
	endDate: Date,
	count: number,
	holidays: Set<string>,
): Date[] {
	const dates: Date[] = [];
	for (let d = new Date(endDate); dates.length < count; d = addDays(d, -1)) {
		if (isBusinessDay(d, holidays)) dates.push(new Date(d));
	}
	return dates.sort((a, b) => a.getTime() - b.getTime());
}

function lastOccurrences(
	endDate: Date,
	day: DAYOFWEEK,
	count: number,
	holidays: Set<string>,
): Date[] {
	const target = DAY_INDEX[day];
	const dates: Date[] = [];
	for (let d = new Date(endDate); dates.length < count; d = addDays(d, -1)) {
		if (d.getDay() === target && !holidays.has(toLocalDate(d))) {
			dates.push(new Date(d));
		}
	}
	return dates.sort((a, b) => a.getTime() - b.getTime());
}

function countBusinessDays(
	start: Date,
	end: Date,
	holidays: Set<string>,
): number {
	let count = 0;
	for (let d = new Date(start); d < end; d = addDays(d, 1)) {
		if (isBusinessDay(d, holidays)) count++;
	}
	return count;
}

async function main(): Promise<void> {
	const orm = await MikroORM.init(
		defineConfig({
			driver: PostgreSqlDriver,
			clientUrl: process.env.DATABASE_URL,
			entities: ['./src/**/*.orm-entity.ts'],
			entitiesTs: ['./src/**/*.orm-entity.ts'],
			metadataProvider: TsMorphMetadataProvider,
			allowGlobalContext: true,
		}),
	);
	const em = orm.em.fork();

	console.log('🌱 Iniciando seed de vir-ttend...');

	await em.getConnection().execute(`
		TRUNCATE TABLE
			"justification",
			"attendanceRecord",
			"attendance_alerts",
			"monthly_reports",
			"announcements",
			"schedule_slots",
			"subjects",
			"students",
			"courses",
			"academic_years",
			"refresh_tokens",
			"user_tenant_memberships",
			"tenants",
			"users"
		RESTART IDENTITY CASCADE;
	`);

	const holidays = new Set(HOLIDAYS_2026);

	const tenant = em.create(TenantOrmEntity, {
		id: randomUUID(),
		name: 'Colegio Demo San Martín',
		subdomain: 'colegio-demo',
		contactEmail: 'contacto@colegiodemo.edu',
		isActive: true,
	});
	await em.flush();

	const userById = new Map<UserKey, UserOrmEntity>();
	for (const user of USERS) {
		const passwordHash = await bcryptHash(user.password, 10);
		userById.set(
			user.key,
			em.create(UserOrmEntity, {
				id: randomUUID(),
				email: user.email,
				passwordHash,
				firstName: user.firstName,
				lastName: user.lastName,
				isActive: true,
				mustChangePassword: false,
			}),
		);
	}
	await em.flush();

	for (const user of USERS) {
		if (!user.role) continue;
		em.create(UserTenantMembershipOrmEntity, {
			userId: userById.get(user.key)?.id,
			tenantId: tenant.id,
			role: user.role,
			isActive: true,
		});
	}
	await em.flush();

	const academicYear = em.create(AcademicYearOrmEntity, {
		id: randomUUID(),
		schoolId: tenant.id,
		year: 2026,
		startDate: new Date(2026, 2, 2),
		endDate: new Date(2026, 11, 18),
		isActive: true,
		nonWorkingDays: HOLIDAYS_2026.map((d) => new Date(d)),
		absenceThresholdPercent: 75,
		lateCountAbscenseAfterMinutes: 15,
	});
	await em.flush();

	const divisionCol = await em
		.getConnection()
		.execute(
			`SELECT data_type FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'division'`,
		);
	const divisionIsNumeric = divisionCol[0]?.data_type === 'integer';
	const divisionValue = (letter: string): string | number =>
		divisionIsNumeric ? letter.charCodeAt(0) - 64 : letter;

	const courseById = new Map<
		string,
		{ course: CourseOrmEntity; seed: SeedCourse }
	>();
	const subjectByCourse = new Map<string, SubjectOrmEntity[]>();
	const studentByCourse = new Map<string, StudentOrmEntity[]>();
	const studentIdByKey = new Map<string, string>();
	const profileByStudent = new Map<string, AbsenceProfile>();

	for (const seed of COURSES) {
		const course = em.create(CourseOrmEntity, {
			id: randomUUID(),
			schoolId: tenant.id,
			academicYearId: academicYear.id,
			academicYear,
			preceptorId: userById.get(seed.preceptorKey)?.id,
			level: seed.level,
			isActive: true,
			yearNumber: seed.yearNumber,
			division: divisionValue(seed.divisionLetter) as string,
			shift: seed.shift,
		});
		courseById.set(course.id, { course, seed });

		const students: StudentOrmEntity[] = [];
		for (const studentSeed of seed.students) {
			const student = em.create(StudentOrmEntity, {
				id: randomUUID(),
				tenantId: tenant.id,
				courseId: course.id,
				course,
				firstName: studentSeed.firstName,
				lastName: studentSeed.lastName,
				documentNumber: studentSeed.dni,
				birthDate: new Date(studentSeed.birthDate),
				tutorName: studentSeed.tutorName,
				tutorPhone: studentSeed.tutorPhone,
				tutorEmail: studentSeed.tutorEmail,
				status: studentSeed.status ?? STUDENTSTATUS.ACTIVE,
			});
			students.push(student);
			profileByStudent.set(student.id, studentSeed.profile);
			studentIdByKey.set(
				`${seed.key}:${studentSeed.firstName} ${studentSeed.lastName}`,
				student.id,
			);
		}
		studentByCourse.set(course.id, students);

		const subjects: SubjectOrmEntity[] = [];
		for (const subjectSeed of seed.subjects) {
			const subject = em.create(SubjectOrmEntity, {
				id: randomUUID(),
				courseId: course.id,
				course,
				teacherId: userById.get(subjectSeed.teacherKey)?.id,
				name: subjectSeed.name,
				area: subjectSeed.area,
				weeklyHours: subjectSeed.weeklyHours,
			});
			subjects.push(subject);
			for (const slot of subjectSeed.slots) {
				em.create(ScheduleSlotOrmEntity, {
					id: randomUUID(),
					subjectId: subject.id,
					subject,
					courseId: course.id,
					dayOfWeek: slot.day,
					startTime: slot.start,
					endTime: slot.end,
				});
			}
		}
		subjectByCourse.set(course.id, subjects);
	}
	await em.flush();

	const now = new Date();
	const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const academicStart = new Date(2026, 2, 2);
	const dailyDates = lastBusinessDays(todayStart, 15, holidays);

	const records: AttendanceRecordOrmEntity[] = [];

	for (const { course, seed } of courseById.values()) {
		const preceptorId = userById.get(seed.preceptorKey)?.id;
		const students =
			studentByCourse
				.get(course.id)
				?.filter((s) => s.status === STUDENTSTATUS.ACTIVE) ?? [];

		for (const date of dailyDates) {
			if (date < academicStart) continue;
			for (const student of students) {
				const rnd = mulberry32(hashString(`${student.id}:${toLocalDate(date)}`));
				const profile = profileByStudent.get(student.id) ?? 'normal';
				const status = pickStatus(profile, rnd);
				records.push(
					em.create(AttendanceRecordOrmEntity, {
						id: randomUUID(),
						tenantId: tenant.id,
						studentId: student.id,
						courseId: course.id,
						date,
						status,
						editedBy: preceptorId,
						editedAt: date,
						createdAt: date,
					}),
				);
			}
		}

		for (const subjectSeed of seed.subjects) {
			const subject = subjectByCourse
				.get(course.id)
				?.find((s) => s.name === subjectSeed.name);
			if (!subject) continue;
			const teacherId = userById.get(subjectSeed.teacherKey)?.id;
			for (const slot of subjectSeed.slots) {
				const classDates = lastOccurrences(todayStart, slot.day, 3, holidays);
				for (const date of classDates) {
					if (date < academicStart) continue;
					for (const student of students) {
						const rnd = mulberry32(
							hashString(`${subject.id}:${student.id}:${toLocalDate(date)}`),
						);
						const profile = profileByStudent.get(student.id) ?? 'normal';
						const status = pickStatus(profile, rnd);
						records.push(
							em.create(AttendanceRecordOrmEntity, {
								id: randomUUID(),
								tenantId: tenant.id,
								studentId: student.id,
								courseId: course.id,
								subjectId: subject.id,
								date,
								status,
								editedBy: teacherId,
								editedAt: date,
								createdAt: date,
							}),
						);
					}
				}
			}
		}
	}
	await em.flush();

	const adminId = userById.get('admin')?.id;
	const justificationTargets = [
		{ key: '6A:Mateo Giménez', count: 2 },
		{ key: '1A:Juan Pérez', count: 1 },
	];
	for (const target of justificationTargets) {
		const studentId = studentIdByKey.get(target.key);
		if (!studentId) continue;
		const absences = records.filter(
			(r) =>
				r.studentId === studentId && r.status === 'absent' && r.subjectId == null,
		);
		for (let i = 0; i < Math.min(target.count, absences.length); i++) {
			const record = absences[i];
			record.status = 'justified';
			em.create(JustificationOrmEntity, {
				id: randomUUID(),
				attendanceRecordId: record.id,
				attendanceRecord: record,
				reason: 'Inasistencia por razones médicas (certificado adjunto).',
				notes: 'Certificado médico presentado por el tutor.',
				createdBy: adminId,
				createdAt: addDays(record.date, 1),
			});
		}
	}
	await em.flush();

	const alertTypesByStudent = new Map<
		string,
		{ status: 'warning' | 'critical' | 'exceeded' }
	>();
	const alerts: AttendanceAlertOrmEntity[] = [];
	for (const { course } of courseById.values()) {
		for (const student of studentByCourse.get(course.id) ?? []) {
			const daily = records.filter(
				(r) =>
					r.courseId === course.id &&
					r.studentId === student.id &&
					r.subjectId == null,
			);
			if (daily.length === 0) continue;
			const absent = daily.filter((r) => r.status === 'absent').length;
			const percent = Math.round((absent / daily.length) * 100);
			const type =
				percent >= 100
					? 'exceeded'
					: percent >= 75
						? 'critical'
						: percent >= 50
							? 'warning'
							: null;
			if (!type) continue;
			const alert = em.create(AttendanceAlertOrmEntity, {
				id: randomUUID(),
				studentId: student.id,
				courseId: course.id,
				academicYearId: academicYear.id,
				tenantId: tenant.id,
				alertType: type,
				absencePercent: percent,
				createdAt: new Date(),
			});
			alerts.push(alert);
			alertTypesByStudent.set(student.id, { status: type });
		}
	}

	const seenStudentId = studentIdByKey.get('6A:Santiago Paz');
	const seenAlert = alerts.find((a) => a.studentId === seenStudentId);
	if (seenAlert) {
		seenAlert.seenAt = new Date();
		seenAlert.seenBy = userById.get('preceptor1')?.id;
	}
	await em.flush();

	const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
	const periods = [
		{ month: prevDate.getMonth() + 1, year: prevDate.getFullYear() },
		{ month: now.getMonth() + 1, year: now.getFullYear() },
	];

	for (const { course, seed } of courseById.values()) {
		const courseName = `${seed.yearNumber}° ${divisionValue(seed.divisionLetter)}°`;
		for (const period of periods) {
			const monthStart = new Date(period.year, period.month - 1, 1);
			const monthEnd = new Date(period.year, period.month, 1);
			const workingDays = countBusinessDays(monthStart, monthEnd, holidays);

			const students: StudentReportEntry[] = [];
			for (const student of studentByCourse.get(course.id) ?? []) {
				const inMonth = records.filter(
					(r) =>
						r.studentId === student.id && r.date >= monthStart && r.date < monthEnd,
				);
				if (inMonth.length === 0) continue;

				const present = inMonth.filter((r) => r.status === 'present').length;
				const absent = inMonth.filter((r) => r.status === 'absent').length;
				const late = inMonth.filter((r) => r.status === 'late').length;
				const justified = inMonth.filter((r) => r.status === 'justified').length;
				const absencePercent = Math.round(
					((inMonth.length - present) / inMonth.length) * 100,
				);
				const status =
					absencePercent >= 85
						? 'exceeded'
						: absencePercent >= 75
							? 'at-risk'
							: 'ok';
				const alert = alertTypesByStudent.get(student.id);
				const studentAlerts = alert ? [{ status: alert.status }] : [];

				students.push({
					studentId: student.id,
					fullName: `${student.firstName} ${student.lastName}`,
					documentNumber: student.documentNumber,
					present,
					absent,
					late,
					justified,
					absencePercent,
					status,
					alerts: studentAlerts,
				});
			}

			const totalRecords = students.reduce(
				(a, s) => a + s.present + s.absent + s.late + s.justified,
				0,
			);
			const totalPresent = students.reduce((a, s) => a + s.present, 0);

			const data: IMonthlyReportData = {
				courseName,
				level: seed.level,
				period,
				workingDays,
				students,
				summary: {
					averageAttendance:
						totalRecords > 0
							? Math.round((totalPresent / totalRecords) * 100) / 100
							: 0,
					studentsAtRisk: students.filter((s) => s.status === 'at-risk').length,
					studentsExceeded: students.filter((s) => s.status === 'exceeded').length,
				},
			};

			em.create(MonthlyReportOrmEntity, {
				id: randomUUID(),
				tenantId: tenant.id,
				courseId: course.id,
				academicYearId: academicYear.id,
				month: period.month,
				year: period.year,
				data,
				generatedAt: new Date(),
			});
		}
	}
	await em.flush();

	const sixACourse = [...courseById.values()].find(
		(e) => e.seed.key === '6A',
	)?.course;

	const announcements = [
		{
			title: 'Inicio de Talleres Extracurriculares',
			body:
				'Informamos a toda la comunidad que comienzan los talleres extracurriculares de arte, música y robótica.',
			targetType: 'school' as const,
			targetId: null,
			status: 'published' as const,
			publishAt: null,
		},
		{
			title: 'Salida Didáctica a Museo Histórico',
			body:
				'El curso 6º A realizará una salida educativa al Museo Histórico Nacional el próximo viernes.',
			targetType: 'course' as const,
			targetId: sixACourse.id,
			status: 'published' as const,
			publishAt: null,
		},
		{
			title: 'Reunión de Personal Docente',
			body:
				'Se convoca a todo el personal docente a la reunión de coordinación del nivel primario.',
			targetType: 'level' as const,
			targetId: 'primary',
			status: 'published' as const,
			publishAt: null,
		},
		{
			title: 'Circular Informativa Exámenes Trimestrales',
			body:
				'Borrador de la circular sobre el calendario de exámenes trimestrales para su revisión.',
			targetType: 'school' as const,
			targetId: null,
			status: 'draft' as const,
			publishAt: addDays(now, 30),
		},
	];

	for (const announcement of announcements) {
		em.create(AnnouncementOrmEntity, {
			id: randomUUID(),
			schoolId: tenant.id,
			tenantId: tenant.id,
			authorId: adminId,
			...announcement,
		});
	}
	await em.flush();

	await orm.close();

	console.log('✅ Seed completado.');
	console.log('─────────────────────────────────────────────');
	console.log(`Tenant:  ${tenant.name} (subdomain: ${tenant.subdomain})`);
	console.log(`Año académico: 2026 (id: ${academicYear.id})`);
	console.log(`Cursos: ${courseById.size}`);
	for (const { course, seed } of courseById.values()) {
		console.log(
			`   - ${seed.key} | ${seed.level} ${seed.yearNumber}°${seed.divisionLetter} | ${seed.shift} | id: ${course.id}`,
		);
	}
	console.log(`Estudiantes: ${profileByStudent.size}`);
	console.log(
		`Registros de asistencia: ${records.length} (diarios + por materia)`,
	);
	console.log(
		`Justificaciones: ${justificationTargets.reduce((a, t) => a + t.count, 0)}`,
	);
	console.log(
		`Alertas: ${alerts.length} (${alerts.filter((a) => a.seenAt == null).length} sin ver, 1 vista)`,
	);
	console.log(
		`Reportes mensuales: ${courseById.size * periods.length} (${periods.map((p) => `${p.month}/${p.year}`).join(' y ')})`,
	);
	console.log(`Comunicados: ${announcements.length} (3 publicados, 1 draft)`);
	console.log('─────────────────────────────────────────────');
	console.log('Credenciales demo:');
	for (const user of USERS) {
		console.log(
			`   ${user.email} / ${user.password} (${user.role ?? 'superadmin'})`,
		);
	}
}

main().catch((error) => {
	console.error('❌ Error durante el seed:', error);
	process.exit(1);
});
