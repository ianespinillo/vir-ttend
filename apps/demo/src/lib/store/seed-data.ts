/**
 * Demo store — deterministic seed data.
 *
 * Everything in this module is FIXED: fixed ids (deterministic UUIDv4-format),
 * fixed names, fixed dates relative to DEMO_TODAY ('2026-06-19'). The seed
 * generator is idempotent and pure — calling createSeedState() twice yields
 * two value-equal states, which is what the persistence tests rely on.
 *
 * Source of truth: docs/demo/demo-data-seeds-plan.md §2 (users, courses,
 * schedule, students + attendance profiles) and §3 (alerts, announcements).
 * Absence math (bands, late equivalence) is imported from selectors.ts so the
 * seeded alerts ALWAYS match what the selectors compute at render time.
 */

import {
	ATTENDANCE_STATUS,
	type Alert,
	type Announcement,
	type AttendanceRecordJustification,
	DAYOFWEEK,
	type ICourseResponse,
	type IScheduleSlotResponse,
	type ISubjectResponse,
	LEVEL,
	ROLES,
	SHIFT,
	STUDENTSTATUS,
	type Tenant,
} from '@repo/common';
import {
	absencePercent,
	absenceToAlertType,
	generateLastBusinessDays,
} from './selectors';
import {
	DEMO_ACADEMIC_END,
	DEMO_ACADEMIC_START,
	DEMO_ATTENDANCE_DAYS,
	DEMO_DEFAULT_PASSWORD,
	DEMO_TODAY,
	type DemoAttendanceRecord,
	type DemoState,
	type DemoStudent,
	type DemoUser,
	demoTodayDate,
} from './types';

// ---------------------------------------------------------------------------
// Deterministic UUIDv4-format ids (FNV-1a 32-bit over "namespace:slug").
// ---------------------------------------------------------------------------

export function demoUuid(namespace: string, slug: string): string {
	const hash = fnv1a(`${namespace}:${slug}`);
	const hex = hash.toString(16).padStart(8, '0');
	// xxxxxxxx-0000-4000-8000-0000xxxxxxxx -> valid uuid shape for zod.
	return `${hex}-0000-4000-8000-0000${hex}`;
}

function fnv1a(input: string): number {
	let hash = 0x811c9dc5;
	for (let i = 0; i < input.length; i++) {
		hash ^= input.charCodeAt(i);
		hash = Math.imul(hash, 0x01000193);
	}
	return hash >>> 0;
}

/**
 * The fixed ids of the demo, grouped by domain. Typed as literal-keyed maps
 * (NOT index signatures) so that, under `noUncheckedIndexedAccess`, known
 * slugs resolve to `string` instead of `string | undefined`.
 */
type Catalog<T extends string> = Readonly<Record<T, string>>;

export interface DemoIdsCatalog {
	tenant: Catalog<'san-martin' | 'belgrano' | 'sol-del-sur'>;
	user: Catalog<
		| 'carlos-ramos'
		| 'ana-gomez'
		| 'roberto-lopez'
		| 'laura-martinez'
		| 'javier-perez'
		| 'elena-fernandez'
	>;
	academicYear: Catalog<'ay-2026'>;
	course: Catalog<'crs-1a' | 'crs-3a'>;
	subject: Catalog<'sub-mat' | 'sub-hist' | 'sub-leng'>;
	schedule: Catalog<
		| 'sch-mat-mon'
		| 'sch-mat-wed'
		| 'sch-hist-tue'
		| 'sch-hist-thu'
		| 'sch-leng-mon'
		| 'sch-leng-fri'
	>;
	student: Catalog<
		| 'martin-benitez'
		| 'sofia-rossi'
		| 'joaquin-diaz'
		| 'lucia-morales'
		| 'mateo-gimenez'
		| 'camila-sosa'
		| 'tomas-pereyra'
		| 'martina-acuna'
		| 'benjamin-vega'
		| 'catalina-rios'
		| 'franco-arce'
		| 'julieta-campos'
		| 'valentina-fernandez'
		| 'santiago-paz'
		| 'bruno-alvarez'
		| 'emma-villalba'
		| 'mateo-herrera'
		| 'delfina-ortiz'
		| 'julian-romero'
		| 'morena-cabral'
		| 'thiago-medina'
		| 'pilar-aguirre'
		| 'nicolas-duarte'
		| 'renata-silva'
	>;
	announcement: Catalog<'annc-1' | 'annc-2' | 'annc-3' | 'annc-4'>;
}

type StudentSlug = keyof DemoIdsCatalog['student'];

/** Every fixed id the demo knows, exported for tests and pages. */
export const demoIds: DemoIdsCatalog = {
	tenant: {
		'san-martin': demoUuid('tenant', 'san-martin'),
		belgrano: demoUuid('tenant', 'belgrano'),
		'sol-del-sur': demoUuid('tenant', 'sol-del-sur'),
	},
	user: {
		'carlos-ramos': demoUuid('user', 'carlos-ramos'),
		'ana-gomez': demoUuid('user', 'ana-gomez'),
		'roberto-lopez': demoUuid('user', 'roberto-lopez'),
		'laura-martinez': demoUuid('user', 'laura-martinez'),
		'javier-perez': demoUuid('user', 'javier-perez'),
		'elena-fernandez': demoUuid('user', 'elena-fernandez'),
	},
	academicYear: {
		'ay-2026': demoUuid('academic-year', '2026'),
	},
	course: {
		'crs-1a': demoUuid('course', 'crs-1a'),
		'crs-3a': demoUuid('course', 'crs-3a'),
	},
	subject: {
		'sub-mat': demoUuid('subject', 'sub-mat'),
		'sub-hist': demoUuid('subject', 'sub-hist'),
		'sub-leng': demoUuid('subject', 'sub-leng'),
	},
	schedule: {
		'sch-mat-mon': demoUuid('schedule', 'sch-mat-mon'),
		'sch-mat-wed': demoUuid('schedule', 'sch-mat-wed'),
		'sch-hist-tue': demoUuid('schedule', 'sch-hist-tue'),
		'sch-hist-thu': demoUuid('schedule', 'sch-hist-thu'),
		'sch-leng-mon': demoUuid('schedule', 'sch-leng-mon'),
		'sch-leng-fri': demoUuid('schedule', 'sch-leng-fri'),
	},
	student: {
		'martin-benitez': demoUuid('student', 'martin-benitez'),
		'sofia-rossi': demoUuid('student', 'sofia-rossi'),
		'joaquin-diaz': demoUuid('student', 'joaquin-diaz'),
		'lucia-morales': demoUuid('student', 'lucia-morales'),
		'mateo-gimenez': demoUuid('student', 'mateo-gimenez'),
		'camila-sosa': demoUuid('student', 'camila-sosa'),
		'tomas-pereyra': demoUuid('student', 'tomas-pereyra'),
		'martina-acuna': demoUuid('student', 'martina-acuna'),
		'benjamin-vega': demoUuid('student', 'benjamin-vega'),
		'catalina-rios': demoUuid('student', 'catalina-rios'),
		'franco-arce': demoUuid('student', 'franco-arce'),
		'julieta-campos': demoUuid('student', 'julieta-campos'),
		'valentina-fernandez': demoUuid('student', 'valentina-fernandez'),
		'santiago-paz': demoUuid('student', 'santiago-paz'),
		'bruno-alvarez': demoUuid('student', 'bruno-alvarez'),
		'emma-villalba': demoUuid('student', 'emma-villalba'),
		'mateo-herrera': demoUuid('student', 'mateo-herrera'),
		'delfina-ortiz': demoUuid('student', 'delfina-ortiz'),
		'julian-romero': demoUuid('student', 'julian-romero'),
		'morena-cabral': demoUuid('student', 'morena-cabral'),
		'thiago-medina': demoUuid('student', 'thiago-medina'),
		'pilar-aguirre': demoUuid('student', 'pilar-aguirre'),
		'nicolas-duarte': demoUuid('student', 'nicolas-duarte'),
		'renata-silva': demoUuid('student', 'renata-silva'),
	},
	announcement: {
		'annc-1': demoUuid('announcement', 'annc-1'),
		'annc-2': demoUuid('announcement', 'annc-2'),
		'annc-3': demoUuid('announcement', 'annc-3'),
		'annc-4': demoUuid('announcement', 'annc-4'),
	},
};

export const DEFAULT_DEMO_PASSWORD = DEMO_DEFAULT_PASSWORD;

// ---------------------------------------------------------------------------
// Fixed dataset
// ---------------------------------------------------------------------------

interface StudentSeed {
	slug: StudentSlug;
	firstName: string;
	lastName: string;
	documentNumber: string;
	birthDate: string;
	tutorName: string;
	tutorPhone: string;
	tutorEmail?: string;
}

const SECONDARY_STUDENTS: StudentSeed[] = [
	{
		slug: 'martin-benitez',
		firstName: 'Martín',
		lastName: 'Benítez',
		documentNumber: '40123401',
		birthDate: '2013-02-11',
		tutorName: 'Héctor Benítez',
		tutorPhone: '11-2345-6701',
		tutorEmail: 'hector.benitez@gmail.com',
	},
	{
		slug: 'sofia-rossi',
		firstName: 'Sofía',
		lastName: 'Rossi',
		documentNumber: '40123402',
		birthDate: '2013-04-22',
		tutorName: 'Marcela Rossi',
		tutorPhone: '11-2345-6702',
		tutorEmail: 'marcela.rossi@gmail.com',
	},
	{
		slug: 'joaquin-diaz',
		firstName: 'Joaquín',
		lastName: 'Díaz',
		documentNumber: '40123403',
		birthDate: '2013-06-03',
		tutorName: 'Jorge Díaz',
		tutorPhone: '11-2345-6703',
	},
	{
		slug: 'lucia-morales',
		firstName: 'Lucía',
		lastName: 'Morales',
		documentNumber: '40123404',
		birthDate: '2013-01-15',
		tutorName: 'Paula Morales',
		tutorPhone: '11-2345-6704',
		tutorEmail: 'paula.morales@gmail.com',
	},
	{
		slug: 'mateo-gimenez',
		firstName: 'Mateo',
		lastName: 'Giménez',
		documentNumber: '40123405',
		birthDate: '2013-09-28',
		tutorName: 'Ricardo Giménez',
		tutorPhone: '11-2345-6705',
	},
	{
		slug: 'camila-sosa',
		firstName: 'Camila',
		lastName: 'Sosa',
		documentNumber: '40123406',
		birthDate: '2013-11-09',
		tutorName: 'Silvia Sosa',
		tutorPhone: '11-2345-6706',
	},
	{
		slug: 'tomas-pereyra',
		firstName: 'Tomás',
		lastName: 'Pereyra',
		documentNumber: '40123407',
		birthDate: '2013-05-17',
		tutorName: 'Andrés Pereyra',
		tutorPhone: '11-2345-6707',
	},
	{
		slug: 'martina-acuna',
		firstName: 'Martina',
		lastName: 'Acuña',
		documentNumber: '40123408',
		birthDate: '2013-07-30',
		tutorName: 'Florencia Acuña',
		tutorPhone: '11-2345-6708',
	},
	{
		slug: 'benjamin-vega',
		firstName: 'Benjamín',
		lastName: 'Vega',
		documentNumber: '40123409',
		birthDate: '2013-03-14',
		tutorName: 'Gustavo Vega',
		tutorPhone: '11-2345-6709',
	},
	{
		slug: 'catalina-rios',
		firstName: 'Catalina',
		lastName: 'Ríos',
		documentNumber: '40123410',
		birthDate: '2013-08-25',
		tutorName: 'Carina Ríos',
		tutorPhone: '11-2345-6710',
	},
	{
		slug: 'franco-arce',
		firstName: 'Franco',
		lastName: 'Arce',
		documentNumber: '40123411',
		birthDate: '2013-10-06',
		tutorName: 'Marcos Arce',
		tutorPhone: '11-2345-6711',
	},
	{
		slug: 'julieta-campos',
		firstName: 'Julieta',
		lastName: 'Campos',
		documentNumber: '40123412',
		birthDate: '2013-12-19',
		tutorName: 'Vanesa Campos',
		tutorPhone: '11-2345-6712',
	},
];

const PRIMARY_STUDENTS: StudentSeed[] = [
	{
		slug: 'valentina-fernandez',
		firstName: 'Valentina',
		lastName: 'Fernández',
		documentNumber: '52123001',
		birthDate: '2016-04-08',
		tutorName: 'Federico Fernández',
		tutorPhone: '11-3456-7801',
		tutorEmail: 'federico.fernandez@gmail.com',
	},
	{
		slug: 'santiago-paz',
		firstName: 'Santiago',
		lastName: 'Paz',
		documentNumber: '52123002',
		birthDate: '2016-09-14',
		tutorName: 'Lucía Paz',
		tutorPhone: '11-3456-7802',
		tutorEmail: 'lucia.paz@gmail.com',
	},
	{
		slug: 'bruno-alvarez',
		firstName: 'Bruno',
		lastName: 'Álvarez',
		documentNumber: '52123003',
		birthDate: '2016-01-25',
		tutorName: 'Martín Álvarez',
		tutorPhone: '11-3456-7803',
	},
	{
		slug: 'emma-villalba',
		firstName: 'Emma',
		lastName: 'Villalba',
		documentNumber: '52123004',
		birthDate: '2016-06-30',
		tutorName: 'Cecilia Villalba',
		tutorPhone: '11-3456-7804',
	},
	{
		slug: 'mateo-herrera',
		firstName: 'Mateo',
		lastName: 'Herrera',
		documentNumber: '52123005',
		birthDate: '2016-11-11',
		tutorName: 'Hugo Herrera',
		tutorPhone: '11-3456-7805',
	},
	{
		slug: 'delfina-ortiz',
		firstName: 'Delfina',
		lastName: 'Ortiz',
		documentNumber: '52123006',
		birthDate: '2016-03-22',
		tutorName: 'Andrea Ortiz',
		tutorPhone: '11-3456-7806',
	},
	{
		slug: 'julian-romero',
		firstName: 'Julián',
		lastName: 'Romero',
		documentNumber: '52123007',
		birthDate: '2016-08-05',
		tutorName: 'Diego Romero',
		tutorPhone: '11-3456-7807',
	},
	{
		slug: 'morena-cabral',
		firstName: 'Morena',
		lastName: 'Cabral',
		documentNumber: '52123008',
		birthDate: '2016-05-29',
		tutorName: 'Gabriela Cabral',
		tutorPhone: '11-3456-7808',
	},
	{
		slug: 'thiago-medina',
		firstName: 'Thiago',
		lastName: 'Medina',
		documentNumber: '52123009',
		birthDate: '2016-10-18',
		tutorName: 'Eduardo Medina',
		tutorPhone: '11-3456-7809',
	},
	{
		slug: 'pilar-aguirre',
		firstName: 'Pilar',
		lastName: 'Aguirre',
		documentNumber: '52123010',
		birthDate: '2016-02-14',
		tutorName: 'Rosa Aguirre',
		tutorPhone: '11-3456-7810',
	},
	{
		slug: 'nicolas-duarte',
		firstName: 'Nicolás',
		lastName: 'Duarte',
		documentNumber: '52123011',
		birthDate: '2016-07-07',
		tutorName: 'Pablo Duarte',
		tutorPhone: '11-3456-7811',
	},
	{
		slug: 'renata-silva',
		firstName: 'Renata',
		lastName: 'Silva',
		documentNumber: '52123012',
		birthDate: '2016-12-01',
		tutorName: 'Silvana Silva',
		tutorPhone: '11-3456-7812',
	},
];

type AttendanceStatus =
	(typeof ATTENDANCE_STATUS)[keyof typeof ATTENDANCE_STATUS];

interface StatusPlan {
	subject: 'daily' | keyof (typeof demoIds)['subject'];
	student: string;
	indexes: number[];
	status: AttendanceStatus;
	reasons?: string[];
}

const SECONDARY_OVERRIDES: StatusPlan[] = [
	{
		subject: 'sub-mat',
		student: 'sofia-rossi',
		indexes: [2, 7],
		status: 'absent',
	},
	{
		subject: 'sub-hist',
		student: 'sofia-rossi',
		indexes: [3, 8],
		status: 'absent',
	},
	{
		subject: 'sub-mat',
		student: 'joaquin-diaz',
		indexes: [1, 5, 9],
		status: 'absent',
	},
	{
		subject: 'sub-hist',
		student: 'joaquin-diaz',
		indexes: [2, 6, 10],
		status: 'absent',
	},
	{
		subject: 'sub-mat',
		student: 'lucia-morales',
		indexes: [2, 8],
		status: 'late',
	},
	{
		subject: 'sub-hist',
		student: 'lucia-morales',
		indexes: [3, 9],
		status: 'late',
	},
	{
		subject: 'sub-leng',
		student: 'lucia-morales',
		indexes: [1, 7],
		status: 'late',
	},
	{
		subject: 'sub-mat',
		student: 'mateo-gimenez',
		indexes: [2, 6],
		status: 'justified',
		reasons: ['Certificado médico', 'Motivos familiares'],
	},
	{
		subject: 'sub-hist',
		student: 'mateo-gimenez',
		indexes: [3, 7],
		status: 'justified',
		reasons: ['Certificado médico', 'Certificado médico'],
	},
	{
		subject: 'sub-leng',
		student: 'martina-acuna',
		indexes: [0],
		status: 'late',
	},
	{
		subject: 'sub-mat',
		student: 'catalina-rios',
		indexes: [4],
		status: 'absent',
	},
];

const PRIMARY_OVERRIDES: StatusPlan[] = [
	{
		subject: 'daily',
		student: 'valentina-fernandez',
		indexes: [11],
		status: 'absent',
	},
	{
		subject: 'daily',
		student: 'santiago-paz',
		indexes: [0, 7, 14, 21],
		status: 'absent',
	},
	{ subject: 'daily', student: 'delfina-ortiz', indexes: [5], status: 'late' },
];

// ---------------------------------------------------------------------------
// Seed state factory
// ---------------------------------------------------------------------------

export function createSeedState(): DemoState {
	const tenantIds = demoIds.tenant;
	const userIds = demoIds.user;
	const courseIds = demoIds.course;
	const subjectIds = demoIds.subject;
	const scheduleIds = demoIds.schedule;
	const studentIds = demoIds.student;
	const academicYearIds = demoIds.academicYear;
	const announcementIds = demoIds.announcement;

	const tenants: Tenant[] = [
		{
			id: tenantIds['san-martin'],
			name: 'Colegio San Martín',
			subdomain: 'sanmartin',
			contactEmail: 'contacto@sanmartin.edu.ar',
			isActive: true,
			createdAt: new Date('2024-03-01T09:00:00.000Z'),
		},
		{
			id: tenantIds.belgrano,
			name: 'Instituto Belgrano',
			subdomain: 'belgrano',
			contactEmail: 'admin@belgrano.edu.ar',
			isActive: true,
			createdAt: new Date('2025-02-10T09:00:00.000Z'),
		},
		{
			id: tenantIds['sol-del-sur'],
			name: 'Escuela Sol del Sur',
			subdomain: 'soldelsur',
			contactEmail: 'director@soldelsur.edu.ar',
			isActive: false,
			createdAt: new Date('2026-03-05T09:00:00.000Z'),
		},
	];

	const users: DemoUser[] = [
		{
			id: userIds['carlos-ramos'],
			email: 'superadmin@virttend.com',
			firstName: 'Carlos',
			lastName: 'Ramos',
			role: ROLES.SUPERADMIN,
			isActive: true,
			mustChangePassword: false,
			createdAt: '2024-03-01T09:00:00.000Z',
		},
		{
			id: userIds['ana-gomez'],
			email: 'admin.sanmartin@virttend.com',
			firstName: 'Ana',
			lastName: 'Gómez',
			role: ROLES.ADMIN,
			tenantId: tenantIds['san-martin'],
			isActive: true,
			mustChangePassword: false,
			createdAt: '2024-03-01T09:00:00.000Z',
		},
		{
			id: userIds['roberto-lopez'],
			email: 'preceptor.primaria@virttend.com',
			firstName: 'Roberto',
			lastName: 'López',
			role: ROLES.PRECEPTOR,
			tenantId: tenantIds['san-martin'],
			isActive: true,
			mustChangePassword: false,
			createdAt: '2025-02-10T09:00:00.000Z',
		},
		{
			id: userIds['laura-martinez'],
			email: 'preceptor.secundaria@virttend.com',
			firstName: 'Laura',
			lastName: 'Martínez',
			role: ROLES.PRECEPTOR,
			tenantId: tenantIds['san-martin'],
			isActive: true,
			mustChangePassword: false,
			createdAt: '2025-02-10T09:00:00.000Z',
		},
		{
			id: userIds['javier-perez'],
			email: 'profesor.matematica@virttend.com',
			firstName: 'Javier',
			lastName: 'Pérez',
			role: ROLES.TEACHER,
			tenantId: tenantIds['san-martin'],
			isActive: true,
			mustChangePassword: false,
			createdAt: '2025-02-26T09:00:00.000Z',
		},
		{
			id: userIds['elena-fernandez'],
			email: 'profesor.historia@virttend.com',
			firstName: 'Elena',
			lastName: 'Fernández',
			role: ROLES.TEACHER,
			tenantId: tenantIds['san-martin'],
			isActive: true,
			mustChangePassword: false,
			createdAt: '2025-03-04T09:00:00.000Z',
		},
	];

	const academicYears: DemoState['academicYears'] = [
		{
			id: academicYearIds['ay-2026'],
			year: 2026,
			startDate: new Date(`${DEMO_ACADEMIC_START}T00:00:00.000Z`),
			endDate: new Date(`${DEMO_ACADEMIC_END}T00:00:00.000Z`),
			absenceThresholdPercent: 15,
			lateCountAbscenseAfterMinutes: 3,
			isActive: true,
		},
	];

	const courses: ICourseResponse[] = [
		{
			id: courseIds['crs-1a'],
			academicYearId: academicYearIds['ay-2026'],
			level: LEVEL.PRIMARY,
			yearNumber: 1,
			division: 'A',
			shift: SHIFT.MORNING,
			preceptorId: userIds['roberto-lopez'],
			preceptorName: 'Roberto López',
			fullName: '1º Grado A',
		},
		{
			id: courseIds['crs-3a'],
			academicYearId: academicYearIds['ay-2026'],
			level: LEVEL.SECONDARY,
			yearNumber: 3,
			division: 'A',
			shift: SHIFT.MORNING,
			preceptorId: userIds['laura-martinez'],
			preceptorName: 'Laura Martínez',
			fullName: '3º Año A',
		},
	];

	const subjects: ISubjectResponse[] = [
		{
			id: subjectIds['sub-mat'],
			courseId: courseIds['crs-3a'],
			name: 'Matemática',
			area: 'Matemática',
			weeklyHours: 4,
			teacherId: userIds['javier-perez'],
			teacherName: 'Javier Pérez',
		},
		{
			id: subjectIds['sub-hist'],
			courseId: courseIds['crs-3a'],
			name: 'Historia',
			area: 'Ciencias Sociales',
			weeklyHours: 3,
			teacherId: userIds['elena-fernandez'],
			teacherName: 'Elena Fernández',
		},
		{
			id: subjectIds['sub-leng'],
			courseId: courseIds['crs-3a'],
			name: 'Lengua y Literatura',
			area: 'Lengua y Literatura',
			weeklyHours: 4,
		},
	];

	const schedules: IScheduleSlotResponse[] = [
		{
			id: scheduleIds['sch-mat-mon'],
			subjectId: subjectIds['sub-mat'],
			dayOfWeek: DAYOFWEEK.MONDAY,
			startTime: '08:00',
			endTime: '09:20',
		},
		{
			id: scheduleIds['sch-mat-wed'],
			subjectId: subjectIds['sub-mat'],
			dayOfWeek: DAYOFWEEK.WEDNESDAY,
			startTime: '08:00',
			endTime: '09:20',
		},
		{
			id: scheduleIds['sch-hist-tue'],
			subjectId: subjectIds['sub-hist'],
			dayOfWeek: DAYOFWEEK.TUESDAY,
			startTime: '09:30',
			endTime: '10:50',
		},
		{
			id: scheduleIds['sch-hist-thu'],
			subjectId: subjectIds['sub-hist'],
			dayOfWeek: DAYOFWEEK.THURSDAY,
			startTime: '09:30',
			endTime: '10:50',
		},
		{
			id: scheduleIds['sch-leng-mon'],
			subjectId: subjectIds['sub-leng'],
			dayOfWeek: DAYOFWEEK.MONDAY,
			startTime: '09:30',
			endTime: '10:50',
		},
		{
			id: scheduleIds['sch-leng-fri'],
			subjectId: subjectIds['sub-leng'],
			dayOfWeek: DAYOFWEEK.FRIDAY,
			startTime: '08:00',
			endTime: '09:20',
		},
	];

	const students: DemoStudent[] = [
		...SECONDARY_STUDENTS.map((seed) =>
			toStudent(seed, courseIds['crs-3a'], '3º Año A'),
		),
		...PRIMARY_STUDENTS.map((seed) =>
			toStudent(seed, courseIds['crs-1a'], '1º Grado A'),
		),
	];

	// --- Attendance ---------------------------------------------------------

	const businessDays = generateLastBusinessDays(
		DEMO_TODAY,
		DEMO_ATTENDANCE_DAYS,
	);
	const attendance: DemoAttendanceRecord[] = [];

	// Primaria: one daily record per student per day.
	for (const date of businessDays) {
		const dayIndex = businessDays.indexOf(date);
		for (const seed of PRIMARY_STUDENTS) {
			const override = getOverride(
				PRIMARY_OVERRIDES,
				'daily',
				seed.slug,
				dayIndex,
			);
			const status = override?.status ?? ATTENDANCE_STATUS.PRESENT;
			pushRecord(
				attendance,
				studentIds[seed.slug],
				seed,
				date,
				courseIds['crs-1a'],
				undefined,
				status,
				override?.reasons,
			);
		}
	}

	// Secundaria: one record per student per subject session. Override plans
	// are keyed by subject SLUG, so iterate slugs and resolve the id from the
	// fixed catalog instead of matching by the generated uuid.
	for (const [subjectSlug, subjectId] of Object.entries(subjectIds)) {
		const weekdays = schedules
			.filter((slot) => slot.subjectId === subjectId)
			.map((slot) => slot.dayOfWeek);
		const sessionDates = businessDays.filter((date) =>
			weekdays.includes(dayOfWeek(date)),
		);
		sessionDates.forEach((date, sessionIndex) => {
			for (const seed of SECONDARY_STUDENTS) {
				const override = getOverride(
					SECONDARY_OVERRIDES,
					subjectSlug,
					seed.slug,
					sessionIndex,
				);
				const status = override?.status ?? ATTENDANCE_STATUS.PRESENT;
				pushRecord(
					attendance,
					studentIds[seed.slug],
					seed,
					date,
					courseIds['crs-3a'],
					subjectId,
					status,
					override?.reasons,
				);
			}
		});
	}

	// --- Alerts (computed with the SAME math the selectors use) --------------

	const studentCourseById = new Map(
		students.map((student) => [student.id, student]),
	);
	const alerts: Alert[] = [];
	for (const seed of [...SECONDARY_STUDENTS, ...PRIMARY_STUDENTS]) {
		const studentId = studentIds[seed.slug];
		const studentRecords = attendance.filter(
			(record) => record.studentId === studentId,
		);
		const counts = { present: 0, absent: 0, late: 0, justified: 0 };
		for (const record of studentRecords) counts[record.status] += 1;
		const pct = absencePercent(counts.absent, counts.late, studentRecords.length);
		const alertType = absenceToAlertType(pct);
		if (!alertType) continue;
		const lastFlagDate =
			[...studentRecords]
				.reverse()
				.find((record) => record.status === 'absent' || record.status === 'late')
				?.date ?? DEMO_TODAY;
		const student = studentCourseById.get(studentId);
		alerts.push({
			id: demoUuid('alert', seed.slug),
			studentId,
			studentName: `${seed.firstName} ${seed.lastName}`,
			courseId: student?.courseId ?? '',
			courseName: student?.courseName ?? '',
			alertType,
			absencePercent: pct,
			seenAt: seed.slug === 'santiago-paz' ? demoTodayDate() : null,
			createdAt: new Date(`${lastFlagDate}T09:30:00.000Z`),
		});
	}

	// --- Announcements -------------------------------------------------------

	const announcements: Announcement[] = [
		{
			id: announcementIds['annc-1'],
			title: 'Inicio de Talleres Extracurriculares',
			body:
				'Se informa a toda la comunidad que los talleres extracurriculares (fútbol, danza, robótica y artes plásticas) comienzan la semana próxima. La inscripción se realiza en secretaría hasta el viernes 26 de junio.',
			targetType: 'school',
			targetId: '',
			status: 'published',
			publishAt: '2026-06-05T12:00:00.000Z',
			authorName: 'Ana María Gómez',
			createdAt: '2026-06-05T12:00:00.000Z',
		},
		{
			id: announcementIds['annc-2'],
			title: 'Reunión de Personal Docente - Viernes 14hs',
			body:
				'Se convoca a todo el equipo docente de 3º Año A a la reunión mensual del viernes a las 14:00 hs en la sala de profesores. Se tratarán las planificaciones del segundo cuatrimestre.',
			targetType: 'course',
			targetId: courseIds['crs-3a'],
			status: 'published',
			publishAt: '2026-06-10T12:00:00.000Z',
			authorName: 'Ana María Gómez',
			createdAt: '2026-06-10T12:00:00.000Z',
		},
		{
			id: announcementIds['annc-3'],
			title: 'Salida Didáctica a Museo Histórico',
			body:
				'El jueves de la próxima semana, 3º Año A visitará el Museo Histórico Nacional en el marco de la materia Historia. Es imprescindible traer la autorización firmada por el tutor.',
			targetType: 'course',
			targetId: courseIds['crs-3a'],
			status: 'published',
			publishAt: '2026-06-11T12:00:00.000Z',
			authorName: 'Laura Martínez',
			createdAt: '2026-06-11T12:00:00.000Z',
		},
		{
			id: announcementIds['annc-4'],
			title: 'Circular Informativa: Exámenes Trimestrales',
			body:
				'Las mesas de exámenes trimestrales del nivel primario se celebrarán la última semana de julio. La planificación detallada se publicará a la brevedad.',
			targetType: 'school',
			targetId: '',
			status: 'draft',
			publishAt: null,
			authorName: 'Ana María Gómez',
			createdAt: '2026-06-18T12:00:00.000Z',
		},
	];

	return {
		version: 1,
		tenants,
		users,
		academicYears,
		courses,
		subjects,
		schedules,
		students,
		attendance,
		alerts,
		announcements,
		announcementReads: {},
		session: { userId: null, tenantId: null },
	};
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getOverride(
	plans: StatusPlan[],
	subject: string,
	studentSlug: string,
	index: number,
): StatusPlan | undefined {
	return plans.find(
		(plan) =>
			plan.subject === subject &&
			plan.student === studentSlug &&
			plan.indexes.includes(index),
	);
}

function toStudent(
	seed: StudentSeed,
	courseId: string,
	courseName: string,
): DemoStudent {
	return {
		id: demoIds.student[seed.slug],
		fullName: `${seed.firstName} ${seed.lastName}`,
		firstName: seed.firstName,
		lastName: seed.lastName,
		documentNumber: seed.documentNumber,
		birthDate: seed.birthDate,
		age: 2026 - Number(seed.birthDate.slice(0, 4)),
		courseId,
		courseName,
		status: STUDENTSTATUS.ACTIVE,
		tutorName: seed.tutorName,
		tutorPhone: seed.tutorPhone,
		tutorEmail: seed.tutorEmail,
	};
}

function dayOfWeek(isoDate: string): DAYOFWEEK {
	const day = new Date(`${isoDate}T00:00:00.000Z`).getUTCDay();
	switch (day) {
		case 1:
			return DAYOFWEEK.MONDAY;
		case 2:
			return DAYOFWEEK.TUESDAY;
		case 3:
			return DAYOFWEEK.WEDNESDAY;
		case 4:
			return DAYOFWEEK.THURSDAY;
		case 5:
			return DAYOFWEEK.FRIDAY;
		// Day 0 (Sunday) never occurs in businessDays; keep the helper total.
		default:
			return DAYOFWEEK.MONDAY;
	}
}

function pushRecord(
	attendance: DemoAttendanceRecord[],
	studentId: string,
	student: StudentSeed,
	date: string,
	courseId: string,
	subjectId: string | undefined,
	status: AttendanceStatus,
	reasons?: string[],
): void {
	const studentName = `${student.firstName} ${student.lastName}`;
	let justification: AttendanceRecordJustification | undefined;
	if (status === 'justified') {
		// Deterministic reason: rotate through the plan's list by how many
		// justified records that student already has in this subject.
		const prior = attendance.filter(
			(record) =>
				record.studentId === studentId &&
				record.subjectId === subjectId &&
				record.status === 'justified',
		).length;
		const reason =
			reasons && reasons.length > 0
				? (reasons[prior % reasons.length] ?? 'Certificado médico')
				: 'Certificado médico';
		justification = {
			id: demoUuid(
				'justification',
				`${studentId}:${date}:${subjectId ?? 'daily'}`,
			),
			reason,
			createdBy: 'Laura Martínez',
			createdAt: new Date(`${date}T12:00:00.000Z`),
		};
	}
	attendance.push({
		id: demoUuid('attendance', `${studentId}:${date}:${subjectId ?? 'daily'}`),
		studentId,
		studentName,
		status,
		courseId,
		subjectId,
		date,
		justification,
	});
}
