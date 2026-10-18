import { APP_ROUTES, ROLES, type Roles, getNavConfig } from '@repo/common';
import {
	TOUR_FINISH,
	TOUR_TENANT_SWITCHER,
	TOUR_WELCOME,
	TUTORIAL_ACADEMIC_CONFIG_STEPS,
	TUTORIAL_ANNOUNCEMENTS_STEPS,
	TUTORIAL_ATTENDANCE_DAILY_STEPS,
	TUTORIAL_ATTENDANCE_SUBJECT_STEPS,
	TUTORIAL_STUDENTS_IMPORT_STEPS,
	TUTORIAL_STUDENT_HISTORY_STEPS,
	getNavTourCopy,
} from './tour-content';

export interface TourStep {
	id: string;
	title: string;
	body: string;
	tips?: string[];
	/** CSS selector of the element to spotlight; centered card when absent. */
	target?: string;
	/** Page the tour opens before showing the step. */
	route?: string;
}

export interface TutorialDefinition {
	id: string;
	title: string;
	description: string;
	badge?: string;
	roles: Roles[];
	steps: TourStep[];
}

export interface BuildTourStepsOptions {
	tenancyMode?: 'multi' | 'single';
	/** Navigation entries the host app cannot open (e.g. demo-only gaps). */
	excludeHrefs?: string[];
}

export const TOUR_TRIGGER_SELECTOR = '[data-tour="tour-trigger"]';
export const TENANT_SWITCHER_SELECTOR = '[data-tour="tenant-switcher"]';

export function navTourSelector(href: string): string {
	return `[data-tour="nav:${href}"]`;
}

/**
 * Builds the tour of a role straight from its navigation, so every step
 * matches an entry the user actually sees in the sidebar.
 */
export function buildTourSteps(
	role: Roles,
	options: BuildTourStepsOptions = {},
): TourStep[] {
	const excluded = new Set(options.excludeHrefs ?? []);
	const navItems = getNavConfig(role, { tenancyMode: options.tenancyMode })
		.flatMap((group) => group.items)
		.filter((item) => !excluded.has(item.href));

	const welcome = TOUR_WELCOME[role];
	const steps: TourStep[] = [
		{ id: 'welcome', title: welcome.title ?? '', body: welcome.body },
	];

	if (role === ROLES.SUPERADMIN && options.tenancyMode !== 'single') {
		steps.push({
			id: 'tenant-switcher',
			title: TOUR_TENANT_SWITCHER.title ?? '',
			body: TOUR_TENANT_SWITCHER.body,
			target: TENANT_SWITCHER_SELECTOR,
		});
	}

	for (const item of navItems) {
		const copy = getNavTourCopy(item.href, role);
		if (!copy) continue;
		steps.push({
			id: `nav:${item.href}`,
			title: copy.title ?? item.label,
			body: copy.body,
			tips: copy.tips,
			target: navTourSelector(item.href),
			route: item.href,
		});
	}

	steps.push({
		id: 'finish',
		title: TOUR_FINISH.title ?? '',
		body: TOUR_FINISH.body,
		target: TOUR_TRIGGER_SELECTOR,
	});

	return steps;
}

/**
 * Returns all available tutorials and guides for a given role,
 * filtering out any tutorials whose main route is excluded.
 */
export function getTutorialsForRole(
	role: Roles,
	options: BuildTourStepsOptions = {},
): TutorialDefinition[] {
	const excluded = new Set(options.excludeHrefs ?? []);
	const list: TutorialDefinition[] = [];

	// 1. General Onboarding Tour
	list.push({
		id: 'onboarding',
		title: 'Tour general de la plataforma',
		description: 'Recorrido inicial por las secciones y navegación del sistema',
		badge: 'General',
		roles: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.PRECEPTOR, ROLES.TEACHER],
		steps: buildTourSteps(role, options),
	});

	// 2. Asistencia diaria (Admin, Preceptor)
	if (
		(role === ROLES.ADMIN || role === ROLES.PRECEPTOR) &&
		!excluded.has(APP_ROUTES.attendanceDaily)
	) {
		list.push({
			id: 'attendance-daily',
			title: 'Toma de asistencia diaria',
			description:
				'Selección de curso, marcado rápido, justificaciones y confirmación',
			badge: 'Asistencia',
			roles: [ROLES.ADMIN, ROLES.PRECEPTOR],
			steps: TUTORIAL_ATTENDANCE_DAILY_STEPS,
		});
	}

	// 3. Asistencia por materia (Docente)
	if (role === ROLES.TEACHER && !excluded.has(APP_ROUTES.attendanceSubject)) {
		list.push({
			id: 'attendance-subject',
			title: 'Toma de asistencia por materia',
			description: 'Registro de presentismo hora por hora para docentes',
			badge: 'Docentes',
			roles: [ROLES.TEACHER],
			steps: TUTORIAL_ATTENDANCE_SUBJECT_STEPS,
		});
	}

	// 4. Carga e importación de alumnos (Admin, Preceptor)
	if (
		(role === ROLES.ADMIN || role === ROLES.PRECEPTOR) &&
		!excluded.has(APP_ROUTES.students)
	) {
		list.push({
			id: 'students-import',
			title: 'Carga e importación de alumnos',
			description: 'Alta individual y carga masiva mediante planilla Excel o CSV',
			badge: 'Alumnos',
			roles: [ROLES.ADMIN, ROLES.PRECEPTOR],
			steps: TUTORIAL_STUDENTS_IMPORT_STEPS,
		});
	}

	// 5. Métricas e historial del alumno (Admin, Preceptor)
	if (
		(role === ROLES.ADMIN || role === ROLES.PRECEPTOR) &&
		!excluded.has(APP_ROUTES.reports)
	) {
		list.push({
			id: 'student-history',
			title: 'Métricas e historial de asistencia',
			description:
				'Reportes mensuales, comparativa y ficha de inasistencias acumuladas',
			badge: 'Métricas',
			roles: [ROLES.ADMIN, ROLES.PRECEPTOR],
			steps: TUTORIAL_STUDENT_HISTORY_STEPS,
		});
	}

	// 6. Ciclo lectivo y días no laborables (Admin)
	if (role === ROLES.ADMIN && !excluded.has(APP_ROUTES.settingsAcademic)) {
		list.push({
			id: 'academic-config',
			title: 'Ciclo lectivo y días no laborables',
			description:
				'Períodos académicos, tolerancias y declaración de feriados o asuetos',
			badge: 'Configuración',
			roles: [ROLES.ADMIN],
			steps: TUTORIAL_ACADEMIC_CONFIG_STEPS,
		});
	}

	// 7. Emisión de comunicados (Admin, Preceptor)
	if (
		(role === ROLES.ADMIN || role === ROLES.PRECEPTOR) &&
		!excluded.has(APP_ROUTES.announcements)
	) {
		list.push({
			id: 'announcements',
			title: 'Emisión de comunicados',
			description:
				'Publicación de circulares institucionales y segmentación de audiencia',
			badge: 'Comunicación',
			roles: [ROLES.ADMIN, ROLES.PRECEPTOR],
			steps: TUTORIAL_ANNOUNCEMENTS_STEPS,
		});
	}

	return list;
}

/** Whether `pathname` is already inside the page a step points at. */
export function isOnRoute(pathname: string, route: string): boolean {
	if (pathname === route) return true;
	if (route === '/dashboard') return false;
	return pathname.startsWith(`${route}/`);
}
