/**
 * Demo store — deterministic seed data.
 *
 * Everything in this module is FIXED: fixed ids (deterministic UUIDv4-format),
 * fixed names, fixed dates relative to DEMO_TODAY ('2026-06-19'). The seed
 * generator is idempotent and pure — calling createSeedState() twice yields
 * two value-equal states, which is what the persistence tests rely on.
 *
 * Source of truth: docs/demo/demo-data-seeds-plan.md §2 (users, courses,
 * schedule, students + attendance profiles) and §3 (alerts, announcements),
 * extended with the workshop commissions / non-working day / weighted absence
 * features (see docs/demo/demo-guide.md). Alerts are produced by replaying the
 * attendance history through the same rules the store applies on every save
 * (alerts.ts + weighted-absence.ts), so seeded alerts ALWAYS match what the
 * selectors compute at render time.
 */

import {
	ATTENDANCE_STATUS,
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
	SUBJECT_KIND,
	type Tenant,
	isWorkshopOnlyCourse,
} from '@repo/common';
import { replayAlerts } from './alerts';
import {
	DEMO_HOLIDAYS,
	DEMO_INSTITUTIONAL_DAY,
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
	type DemoWorkshopCommission,
	type DemoWorkshopRecord,
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
		| 'marcelo-torres'
	>;
	academicYear: Catalog<'ay-2026'>;
	course: Catalog<'crs-1a' | 'crs-3a' | 'crs-7a'>;
	subject: Catalog<
		| 'sub-mat'
		| 'sub-hist'
		| 'sub-leng'
		| 'sub-taller'
		| 'sub-electro'
		| 'sub-autom'
	>;
	commission: Catalog<'c-3a-1' | 'c-3a-2' | 'c-7a-1' | 'c-7a-2'>;
	schedule: Catalog<
		| 'sch-mat-mon'
		| 'sch-mat-wed'
		| 'sch-hist-tue'
		| 'sch-hist-thu'
		| 'sch-leng-mon'
		| 'sch-leng-fri'
		| 'sch-taller-tue'
		| 'sch-taller-thu'
		| 'sch-taller-mon'
		| 'sch-taller-wed'
		| 'sch-electro-mon'
		| 'sch-electro-wed'
		| 'sch-electro-tue'
		| 'sch-electro-thu'
		| 'sch-autom-fri'
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
		| 'agustin-barrios'
		| 'bianca-caruso'
		| 'cristian-dominguez'
		| 'daniela-escobar'
		| 'facundo-funes'
		| 'gisela-godoy'
		| 'ignacio-ibarra'
		| 'jazmin-luna'
		| 'kevin-maidana'
		| 'lautaro-navarro'
	>;
	announcement: Catalog<'annc-1' | 'annc-2' | 'annc-3' | 'annc-4' | 'annc-5'>;
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
		'marcelo-torres': demoUuid('user', 'marcelo-torres'),
	},
	academicYear: {
		'ay-2026': demoUuid('academic-year', '2026'),
	},
	course: {
		'crs-1a': demoUuid('course', 'crs-1a'),
		'crs-3a': demoUuid('course', 'crs-3a'),
		'crs-7a': demoUuid('course', 'crs-7a'),
	},
	subject: {
		'sub-mat': demoUuid('subject', 'sub-mat'),
		'sub-hist': demoUuid('subject', 'sub-hist'),
		'sub-leng': demoUuid('subject', 'sub-leng'),
		'sub-taller': demoUuid('subject', 'sub-taller'),
		'sub-electro': demoUuid('subject', 'sub-electro'),
		'sub-autom': demoUuid('subject', 'sub-autom'),
	},
	commission: {
		'c-3a-1': demoUuid('commission', 'c-3a-1'),
		'c-3a-2': demoUuid('commission', 'c-3a-2'),
		'c-7a-1': demoUuid('commission', 'c-7a-1'),
		'c-7a-2': demoUuid('commission', 'c-7a-2'),
	},
	schedule: {
		'sch-mat-mon': demoUuid('schedule', 'sch-mat-mon'),
		'sch-mat-wed': demoUuid('schedule', 'sch-mat-wed'),
		'sch-hist-tue': demoUuid('schedule', 'sch-hist-tue'),
		'sch-hist-thu': demoUuid('schedule', 'sch-hist-thu'),
		'sch-leng-mon': demoUuid('schedule', 'sch-leng-mon'),
		'sch-leng-fri': demoUuid('schedule', 'sch-leng-fri'),
		'sch-taller-tue': demoUuid('schedule', 'sch-taller-tue'),
		'sch-taller-thu': demoUuid('schedule', 'sch-taller-thu'),
		'sch-taller-mon': demoUuid('schedule', 'sch-taller-mon'),
		'sch-taller-wed': demoUuid('schedule', 'sch-taller-wed'),
		'sch-electro-mon': demoUuid('schedule', 'sch-electro-mon'),
		'sch-electro-wed': demoUuid('schedule', 'sch-electro-wed'),
		'sch-electro-tue': demoUuid('schedule', 'sch-electro-tue'),
		'sch-electro-thu': demoUuid('schedule', 'sch-electro-thu'),
		'sch-autom-fri': demoUuid('schedule', 'sch-autom-fri'),
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
		'agustin-barrios': demoUuid('student', 'agustin-barrios'),
		'bianca-caruso': demoUuid('student', 'bianca-caruso'),
		'cristian-dominguez': demoUuid('student', 'cristian-dominguez'),
		'daniela-escobar': demoUuid('student', 'daniela-escobar'),
		'facundo-funes': demoUuid('student', 'facundo-funes'),
		'gisela-godoy': demoUuid('student', 'gisela-godoy'),
		'ignacio-ibarra': demoUuid('student', 'ignacio-ibarra'),
		'jazmin-luna': demoUuid('student', 'jazmin-luna'),
		'kevin-maidana': demoUuid('student', 'kevin-maidana'),
		'lautaro-navarro': demoUuid('student', 'lautaro-navarro'),
	},
	announcement: {
		'annc-1': demoUuid('announcement', 'annc-1'),
		'annc-2': demoUuid('announcement', 'annc-2'),
		'annc-3': demoUuid('announcement', 'annc-3'),
		'annc-4': demoUuid('announcement', 'annc-4'),
		'annc-5': demoUuid('announcement', 'annc-5'),
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

/** 7º Año A (technical, workshop-only): 10 students split 5/5 into two commissions. */
const WORKSHOP_STUDENTS: StudentSeed[] = [
	{
		slug: 'agustin-barrios',
		firstName: 'Agustín',
		lastName: 'Barrios',
		documentNumber: '38123401',
		birthDate: '2008-02-03',
		tutorName: 'Mónica Barrios',
		tutorPhone: '11-4567-8901',
		tutorEmail: 'monica.barrios@gmail.com',
	},
	{
		slug: 'bianca-caruso',
		firstName: 'Bianca',
		lastName: 'Caruso',
		documentNumber: '38123402',
		birthDate: '2008-05-18',
		tutorName: 'Alberto Caruso',
		tutorPhone: '11-4567-8902',
	},
	{
		slug: 'cristian-dominguez',
		firstName: 'Cristian',
		lastName: 'Domínguez',
		documentNumber: '38123403',
		birthDate: '2008-08-27',
		tutorName: 'Elsa Domínguez',
		tutorPhone: '11-4567-8903',
	},
	{
		slug: 'daniela-escobar',
		firstName: 'Daniela',
		lastName: 'Escobar',
		documentNumber: '38123404',
		birthDate: '2008-01-12',
		tutorName: 'Rubén Escobar',
		tutorPhone: '11-4567-8904',
		tutorEmail: 'ruben.escobar@gmail.com',
	},
	{
		slug: 'facundo-funes',
		firstName: 'Facundo',
		lastName: 'Funes',
		documentNumber: '38123405',
		birthDate: '2008-11-30',
		tutorName: 'Nora Funes',
		tutorPhone: '11-4567-8905',
	},
	{
		slug: 'gisela-godoy',
		firstName: 'Gisela',
		lastName: 'Godoy',
		documentNumber: '38123406',
		birthDate: '2008-04-09',
		tutorName: 'Claudio Godoy',
		tutorPhone: '11-4567-8906',
	},
	{
		slug: 'ignacio-ibarra',
		firstName: 'Ignacio',
		lastName: 'Ibarra',
		documentNumber: '38123407',
		birthDate: '2008-07-21',
		tutorName: 'Lidia Ibarra',
		tutorPhone: '11-4567-8907',
	},
	{
		slug: 'jazmin-luna',
		firstName: 'Jazmín',
		lastName: 'Luna',
		documentNumber: '38123408',
		birthDate: '2008-09-05',
		tutorName: 'Omar Luna',
		tutorPhone: '11-4567-8908',
	},
	{
		slug: 'kevin-maidana',
		firstName: 'Kevin',
		lastName: 'Maidana',
		documentNumber: '38123409',
		birthDate: '2008-03-16',
		tutorName: 'Patricia Maidana',
		tutorPhone: '11-4567-8909',
	},
	{
		slug: 'lautaro-navarro',
		firstName: 'Lautaro',
		lastName: 'Navarro',
		documentNumber: '38123410',
		birthDate: '2008-12-24',
		tutorName: 'Sergio Navarro',
		tutorPhone: '11-4567-8910',
	},
];

type AttendanceStatus =
	(typeof ATTENDANCE_STATUS)[keyof typeof ATTENDANCE_STATUS];

interface StatusPlan {
	subject: 'daily' | 'workshop' | keyof (typeof demoIds)['subject'];
	student: string;
	indexes: number[];
	status: AttendanceStatus;
	reasons?: string[];
	/**
	 * Daily plans of a student with workshop: indexes count only the days the
	 * student has no workshop, so a plain absence weighs the full day.
	 */
	onNonWorkshopDays?: boolean;
}

/** `count` indexes starting at `start`, every `step`. */
function range(start: number, step: number, count: number): number[] {
	return Array.from({ length: count }, (_, i) => start + i * step);
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
	{
		subject: 'sub-hist',
		student: 'martina-acuna',
		indexes: [4],
		status: 'late_beyond_tolerance',
	},
];

/**
 * Daily attendance (preceptor). Chosen so the weighted counts cross the alert
 * thresholds: Sofía (10, warning), Joaquín (20, critical), Santiago (10,
 * warning, seen), Emma (28, exceeded after warning and critical) and Thiago
 * (10 made only of lates: 16 x 0.25 + 12 x 0.5).
 */
const DAILY_OVERRIDES: StatusPlan[] = [
	// Primaria 1º Grado A
	{
		subject: 'daily',
		student: 'valentina-fernandez',
		indexes: [11],
		status: 'absent',
	},
	{
		subject: 'daily',
		student: 'santiago-paz',
		indexes: range(0, 6, 10),
		status: 'absent',
	},
	{
		subject: 'daily',
		student: 'emma-villalba',
		indexes: range(0, 2, 28),
		status: 'absent',
	},
	{
		subject: 'daily',
		student: 'delfina-ortiz',
		indexes: [5, 25, 45],
		status: 'late',
	},
	{
		subject: 'daily',
		student: 'thiago-medina',
		indexes: range(1, 3, 16),
		status: 'late',
	},
	{
		subject: 'daily',
		student: 'thiago-medina',
		indexes: range(2, 3, 12),
		status: 'late_beyond_tolerance',
	},
	{
		subject: 'daily',
		student: 'bruno-alvarez',
		indexes: range(3, 10, 5),
		status: 'justified',
		reasons: ['Certificado médico', 'Motivos familiares'],
	},
	{
		subject: 'daily',
		student: 'mateo-herrera',
		indexes: [9, 39],
		status: 'late_beyond_tolerance',
	},
	// Secundaria 3º Año A (technical: workshop in the opposite shift)
	{
		subject: 'daily',
		student: 'sofia-rossi',
		indexes: [2, 5, 9, 12, 16, 19, 23, 27, 31, 34],
		status: 'absent',
		onNonWorkshopDays: true,
	},
	{
		subject: 'daily',
		student: 'joaquin-diaz',
		indexes: [
			0, 1, 3, 4, 6, 7, 9, 11, 12, 14, 16, 17, 19, 21, 22, 24, 26, 28, 30, 33,
		],
		status: 'absent',
		onNonWorkshopDays: true,
	},
	{
		subject: 'daily',
		student: 'lucia-morales',
		indexes: [3, 8, 13, 18, 23, 28, 33, 35],
		status: 'late',
		onNonWorkshopDays: true,
	},
	{
		subject: 'daily',
		student: 'lucia-morales',
		indexes: [6, 16, 26, 31],
		status: 'late_beyond_tolerance',
		onNonWorkshopDays: true,
	},
	{
		subject: 'daily',
		student: 'mateo-gimenez',
		indexes: [6, 14, 22, 30],
		status: 'justified',
		reasons: ['Certificado médico', 'Motivos familiares'],
		onNonWorkshopDays: true,
	},
	{
		subject: 'daily',
		student: 'martina-acuna',
		indexes: [0, 30],
		status: 'late_beyond_tolerance',
		onNonWorkshopDays: true,
	},
];

/**
 * Workshop attendance plans; indexes count the student's own workshop
 * sessions. Camila misses the workshop AND the daily shift the same days (a
 * full day, 1/2 + 1/2); Benjamín only misses the daily shift on workshop days
 * (counts 1/2).
 */
const WORKSHOP_OVERRIDES: StatusPlan[] = [
	{
		subject: 'workshop',
		student: 'camila-sosa',
		indexes: [3, 4, 9],
		status: 'absent',
	},
	{
		subject: 'workshop',
		student: 'tomas-pereyra',
		indexes: [2, 10, 18],
		status: 'late',
	},
	{
		subject: 'workshop',
		student: 'catalina-rios',
		indexes: [5],
		status: 'absent',
	},
	{
		subject: 'workshop',
		student: 'franco-arce',
		indexes: [6, 14],
		status: 'late_beyond_tolerance',
	},
	// 7º Año A (workshop-only)
	{
		subject: 'workshop',
		student: 'daniela-escobar',
		indexes: range(8, 1, 21),
		status: 'absent',
	},
	{
		subject: 'workshop',
		student: 'kevin-maidana',
		indexes: range(0, 3, 11),
		status: 'absent',
	},
	{
		subject: 'workshop',
		student: 'ignacio-ibarra',
		indexes: range(2, 6, 6),
		status: 'late',
	},
	{
		subject: 'workshop',
		student: 'ignacio-ibarra',
		indexes: range(5, 9, 4),
		status: 'late_beyond_tolerance',
	},
	{
		subject: 'workshop',
		student: 'jazmin-luna',
		indexes: [4, 15, 26],
		status: 'justified',
		reasons: ['Certificado médico'],
	},
	{
		subject: 'workshop',
		student: 'gisela-godoy',
		indexes: [7, 19, 25, 33],
		status: 'absent',
	},
	{
		subject: 'workshop',
		student: 'agustin-barrios',
		indexes: [12],
		status: 'late',
	},
];

/** Students that are absent from the daily shift on their own workshop sessions. */
const DAILY_ABSENT_ON_WORKSHOP_SESSIONS: Record<string, number[]> = {
	'camila-sosa': [3, 4, 9],
	'benjamin-vega': [2, 6],
};

/** Alerts the demo leaves already seen (the rest show as unread). */
const SEEN_ALERTS = new Set([
	'santiago-paz:warning',
	'emma-villalba:warning',
	'emma-villalba:critical',
	'joaquin-diaz:warning',
]);

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
	const commissionIds = demoIds.commission;

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
		{
			id: userIds['marcelo-torres'],
			email: 'preceptor.taller@virttend.com',
			firstName: 'Marcelo',
			lastName: 'Torres',
			role: ROLES.PRECEPTOR,
			tenantId: tenantIds['san-martin'],
			isActive: true,
			mustChangePassword: false,
			createdAt: '2025-03-10T09:00:00.000Z',
		},
	];

	// Non-working days: national holidays of the school year plus the
	// institutional day declared in the demo (it has its own announcement).
	const nonWorkingDays = [...new Set([...DEMO_HOLIDAYS, DEMO_INSTITUTIONAL_DAY])]
		.filter((day) => day >= DEMO_ACADEMIC_START && day <= DEMO_ACADEMIC_END)
		.sort()
		.map((day) => new Date(`${day}T00:00:00.000Z`));

	const academicYears: DemoState['academicYears'] = [
		{
			id: academicYearIds['ay-2026'],
			year: 2026,
			startDate: new Date(`${DEMO_ACADEMIC_START}T00:00:00.000Z`),
			endDate: new Date(`${DEMO_ACADEMIC_END}T00:00:00.000Z`),
			absenceThresholdPercent: 15,
			lateCountAbscenseAfterMinutes: 3,
			isActive: true,
			nonWorkingDays,
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
		{
			id: courseIds['crs-7a'],
			academicYearId: academicYearIds['ay-2026'],
			level: LEVEL.SECONDARY,
			yearNumber: 7,
			division: 'A',
			shift: SHIFT.MORNING,
			preceptorId: userIds['laura-martinez'],
			preceptorName: 'Laura Martínez',
			fullName: '7º Año A',
		},
	];

	const subjects: ISubjectResponse[] = [
		{
			id: subjectIds['sub-mat'],
			courseId: courseIds['crs-3a'],
			name: 'Matemática',
			area: 'Matemática',
			weeklyHours: 4,
			kind: SUBJECT_KIND.THEORY,
			teacherId: userIds['javier-perez'],
			teacherName: 'Javier Pérez',
		},
		{
			id: subjectIds['sub-hist'],
			courseId: courseIds['crs-3a'],
			name: 'Historia',
			area: 'Ciencias Sociales',
			weeklyHours: 3,
			kind: SUBJECT_KIND.THEORY,
			teacherId: userIds['elena-fernandez'],
			teacherName: 'Elena Fernández',
		},
		{
			id: subjectIds['sub-leng'],
			courseId: courseIds['crs-3a'],
			name: 'Lengua y Literatura',
			area: 'Lengua y Literatura',
			weeklyHours: 4,
			kind: SUBJECT_KIND.THEORY,
		},
		// Workshop subjects: teachers without a user account are allowed.
		{
			id: subjectIds['sub-taller'],
			courseId: courseIds['crs-3a'],
			name: 'Taller de Informática',
			area: 'Taller',
			weeklyHours: 4,
			kind: SUBJECT_KIND.WORKSHOP,
			teacherName: 'Daniel Ortega',
		},
		{
			id: subjectIds['sub-electro'],
			courseId: courseIds['crs-7a'],
			name: 'Taller de Electrónica',
			area: 'Taller',
			weeklyHours: 6,
			kind: SUBJECT_KIND.WORKSHOP,
			teacherName: 'Roberto Sáenz',
		},
		{
			id: subjectIds['sub-autom'],
			courseId: courseIds['crs-7a'],
			name: 'Taller de Automatización',
			area: 'Taller',
			weeklyHours: 4,
			kind: SUBJECT_KIND.WORKSHOP,
			teacherName: 'Marta Quiroga',
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
		// 3º Año A workshop (contraturno): commission 1 Tue/Thu, commission 2 Mon/Wed.
		{
			id: scheduleIds['sch-taller-tue'],
			subjectId: subjectIds['sub-taller'],
			dayOfWeek: DAYOFWEEK.TUESDAY,
			startTime: '14:00',
			endTime: '16:00',
			commissionNumber: 1,
		},
		{
			id: scheduleIds['sch-taller-thu'],
			subjectId: subjectIds['sub-taller'],
			dayOfWeek: DAYOFWEEK.THURSDAY,
			startTime: '14:00',
			endTime: '16:00',
			commissionNumber: 1,
		},
		{
			id: scheduleIds['sch-taller-mon'],
			subjectId: subjectIds['sub-taller'],
			dayOfWeek: DAYOFWEEK.MONDAY,
			startTime: '14:00',
			endTime: '16:00',
			commissionNumber: 2,
		},
		{
			id: scheduleIds['sch-taller-wed'],
			subjectId: subjectIds['sub-taller'],
			dayOfWeek: DAYOFWEEK.WEDNESDAY,
			startTime: '14:00',
			endTime: '16:00',
			commissionNumber: 2,
		},
		// 7º Año A (workshop-only): electronics per commission, automation shared.
		{
			id: scheduleIds['sch-electro-mon'],
			subjectId: subjectIds['sub-electro'],
			dayOfWeek: DAYOFWEEK.MONDAY,
			startTime: '08:00',
			endTime: '11:00',
			commissionNumber: 1,
		},
		{
			id: scheduleIds['sch-electro-wed'],
			subjectId: subjectIds['sub-electro'],
			dayOfWeek: DAYOFWEEK.WEDNESDAY,
			startTime: '08:00',
			endTime: '11:00',
			commissionNumber: 1,
		},
		{
			id: scheduleIds['sch-electro-tue'],
			subjectId: subjectIds['sub-electro'],
			dayOfWeek: DAYOFWEEK.TUESDAY,
			startTime: '08:00',
			endTime: '11:00',
			commissionNumber: 2,
		},
		{
			id: scheduleIds['sch-electro-thu'],
			subjectId: subjectIds['sub-electro'],
			dayOfWeek: DAYOFWEEK.THURSDAY,
			startTime: '08:00',
			endTime: '11:00',
			commissionNumber: 2,
		},
		{
			id: scheduleIds['sch-autom-fri'],
			subjectId: subjectIds['sub-autom'],
			dayOfWeek: DAYOFWEEK.FRIDAY,
			startTime: '08:00',
			endTime: '12:00',
			commissionNumber: null,
		},
	];

	// --- Students and workshop commissions ------------------------------------

	const students: DemoStudent[] = [
		...SECONDARY_STUDENTS.map((seed) =>
			toStudent(seed, courseIds['crs-3a'], '3º Año A'),
		),
		...PRIMARY_STUDENTS.map((seed) =>
			toStudent(seed, courseIds['crs-1a'], '1º Grado A'),
		),
		...WORKSHOP_STUDENTS.map((seed) =>
			toStudent(seed, courseIds['crs-7a'], '7º Año A'),
		),
	];

	const workshopCommissions: DemoWorkshopCommission[] = [
		{
			id: commissionIds['c-3a-1'],
			courseId: courseIds['crs-3a'],
			number: 1,
			preceptorId: userIds['laura-martinez'],
		},
		{
			id: commissionIds['c-3a-2'],
			courseId: courseIds['crs-3a'],
			number: 2,
			preceptorId: userIds['marcelo-torres'],
		},
		{
			id: commissionIds['c-7a-1'],
			courseId: courseIds['crs-7a'],
			number: 1,
			preceptorId: userIds['laura-martinez'],
		},
		{
			id: commissionIds['c-7a-2'],
			courseId: courseIds['crs-7a'],
			number: 2,
			preceptorId: userIds['marcelo-torres'],
		},
	];

	// Alphabetical 50/50 split by last name (the product's default placement).
	for (const [courseId, first, second] of [
		[courseIds['crs-3a'], commissionIds['c-3a-1'], commissionIds['c-3a-2']],
		[courseIds['crs-7a'], commissionIds['c-7a-1'], commissionIds['c-7a-2']],
	] as const) {
		const roster = students
			.filter((student) => student.courseId === courseId)
			.sort(
				(a, b) =>
					a.lastName.localeCompare(b.lastName, 'es', { sensitivity: 'base' }) ||
					a.firstName.localeCompare(b.firstName, 'es', { sensitivity: 'base' }),
			);
		const cut = Math.ceil(roster.length / 2);
		roster.forEach((student, index) => {
			student.workshopCommissionId = index < cut ? first : second;
		});
	}

	const commissionNumberOf = new Map(
		students.map((student) => [
			student.id,
			workshopCommissions.find(
				(commission) => commission.id === student.workshopCommissionId,
			)?.number,
		]),
	);

	/** Weekdays a commission of a course has workshop (slots of its workshop subjects). */
	const workshopDays = (courseId: string, number: number): DAYOFWEEK[] =>
		schedules
			.filter((slot) => {
				const subject = subjects.find((item) => item.id === slot.subjectId);
				return (
					subject?.courseId === courseId &&
					subject.kind === SUBJECT_KIND.WORKSHOP &&
					(slot.commissionNumber == null || slot.commissionNumber === number)
				);
			})
			.map((slot) => slot.dayOfWeek);

	// --- Attendance ---------------------------------------------------------

	const businessDays = generateLastBusinessDays(
		DEMO_TODAY,
		DEMO_ATTENDANCE_DAYS,
	);
	const attendance: DemoAttendanceRecord[] = [];
	const workshopAttendance: DemoWorkshopRecord[] = [];

	// Daily shift: primaria and secundaria take attendance every school day;
	// workshop-only courses (7º técnico) have none.
	const dailyRoster = [
		{
			seeds: PRIMARY_STUDENTS,
			courseId: courseIds['crs-1a'],
			creator: 'Roberto López',
		},
		{
			seeds: SECONDARY_STUDENTS,
			courseId: courseIds['crs-3a'],
			creator: 'Laura Martínez',
		},
	];
	for (const { seeds, courseId, creator } of dailyRoster) {
		for (const [dayIndex, date] of businessDays.entries()) {
			for (const seed of seeds) {
				const studentId = studentIds[seed.slug];
				const number = commissionNumberOf.get(studentId);
				const days = number ? workshopDays(courseId, number) : [];
				const ownWorkshopDay = days.includes(dayOfWeek(date));
				// Position of this day among the student's days without workshop.
				const nonWorkshopIndex =
					businessDays
						.slice(0, dayIndex + 1)
						.filter((day) => !days.includes(dayOfWeek(day))).length - 1;
				const sessionIndex =
					businessDays
						.slice(0, dayIndex + 1)
						.filter((day) => days.includes(dayOfWeek(day))).length - 1;
				const crossAbsent =
					ownWorkshopDay &&
					(DAILY_ABSENT_ON_WORKSHOP_SESSIONS[seed.slug] ?? []).includes(
						sessionIndex,
					);
				const override = DAILY_OVERRIDES.find(
					(plan) =>
						plan.student === seed.slug &&
						plan.indexes.includes(
							plan.onNonWorkshopDays ? nonWorkshopIndex : dayIndex,
						) &&
						(!plan.onNonWorkshopDays || !ownWorkshopDay),
				);
				const status = crossAbsent
					? ATTENDANCE_STATUS.ABSENT
					: (override?.status ?? ATTENDANCE_STATUS.PRESENT);
				pushRecord(
					attendance,
					studentId,
					seed,
					date,
					courseId,
					undefined,
					status,
					override?.reasons,
					creator,
				);
			}
		}
	}

	// Secundaria: one record per student per theory-subject session. Override
	// plans are keyed by subject SLUG, so iterate slugs and resolve the id from
	// the fixed catalog instead of matching by the generated uuid.
	for (const subjectSlug of ['sub-mat', 'sub-hist', 'sub-leng'] as const) {
		const subjectId = subjectIds[subjectSlug];
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
					'Laura Martínez',
				);
			}
		});
	}

	// Workshop: one record per commission student on each of its workshop days.
	const workshopSeeds = new Map(
		[...SECONDARY_STUDENTS, ...WORKSHOP_STUDENTS].map((seed) => [
			studentIds[seed.slug],
			seed,
		]),
	);
	for (const commission of workshopCommissions) {
		const days = workshopDays(commission.courseId, commission.number);
		const sessions = businessDays.filter((date) =>
			days.includes(dayOfWeek(date)),
		);
		const members = students.filter(
			(student) => student.workshopCommissionId === commission.id,
		);
		sessions.forEach((date, sessionIndex) => {
			for (const student of members) {
				const seed = workshopSeeds.get(student.id);
				const slug = seed?.slug ?? '';
				const override = WORKSHOP_OVERRIDES.find(
					(plan) => plan.student === slug && plan.indexes.includes(sessionIndex),
				);
				workshopAttendance.push({
					id: demoUuid('workshop-attendance', `${student.id}:${date}`),
					commissionId: commission.id,
					courseId: commission.courseId,
					studentId: student.id,
					studentName: student.fullName,
					status: override?.status ?? ATTENDANCE_STATUS.PRESENT,
					date,
				});
			}
		});
	}

	// --- Alerts: replay the history through the product's threshold rules ----

	const alerts = replayAlerts(
		students,
		attendance,
		workshopAttendance,
		(student) =>
			isWorkshopOnlyCourse(
				courses.find((course) => course.id === student.courseId) ?? {},
			),
		(studentId, alertType) => demoUuid('alert', `${studentId}:${alertType}`),
	);
	const slugById = new Map(
		Object.entries(studentIds).map(([slug, id]) => [id, slug]),
	);
	for (const alert of alerts) {
		if (SEEN_ALERTS.has(`${slugById.get(alert.studentId)}:${alert.alertType}`)) {
			alert.seenAt = demoTodayDate();
		}
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
		// Published automatically when the institutional day was declared.
		{
			id: announcementIds['annc-5'],
			title: 'Suspensión de actividades — Jornada institucional',
			body:
				'Se informa a toda la comunidad educativa que el día 12/06/2026 no habrá dictado de clases ni actividades escolares debido a: Jornada institucional. El día ha sido registrado como no laborable en el calendario académico institucional.',
			targetType: 'school',
			targetId: '',
			status: 'published',
			publishAt: '2026-06-09T12:00:00.000Z',
			authorName: 'Ana María Gómez',
			createdAt: '2026-06-09T12:00:00.000Z',
		},
	];

	return {
		version: 2,
		tenants,
		users,
		academicYears,
		courses,
		subjects,
		schedules,
		students,
		attendance,
		workshopCommissions,
		workshopAttendance,
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
	createdBy = 'Laura Martínez',
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
			createdBy,
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
