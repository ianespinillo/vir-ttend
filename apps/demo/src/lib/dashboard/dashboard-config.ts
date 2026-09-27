/**
 * Demo dashboard — pure per-role composition config.
 *
 * Maps each demo role to the product dashboard view it renders on `/dashboard`,
 * the store scoping that feeds its sections, and the Spanish header copy used
 * by the demo-only panels (product panels keep their own internal copy).
 *
 * Framework-free by design: the vitest suite covers it without jsdom.
 */

import { ROLES, type Roles } from '@repo/common';

/**
 * Product dashboard views composable on `/dashboard`:
 *
 * - `superadmin-analytics`: SuperAdminDashboard (platform KPIs + tenants
 *   trend). Matches the client's SuperAdminDashboardRoute.
 * - `preceptor-panel`: PreceptorDashboard (header + metrics + courses +
 *   trend). Matches the client's PreceptorDashboardRoute, shared by admin and
 *   preceptor; the header copy varies by role.
 * - `teacher-panel`: demo-only composition (header + metrics + own courses +
 *   trend). The client redirects teachers from `/dashboard` to their
 *   subjects, so there is no product panel to reuse.
 */
export type DashboardView =
	| 'superadmin-analytics'
	| 'preceptor-panel'
	| 'teacher-panel';

/** Which courses feed the metric cards: all school courses or the role's own. */
export type DashboardMetricsScope = 'school' | 'own';

/** Which courses render in the courses overview ('none' when the view has none). */
export type DashboardCoursesScope = 'school' | 'own' | 'none';

export interface RoleDashboardConfig {
	/** The product panel composing this role's dashboard. */
	view: DashboardView;
	/** Courses feeding DashboardMetricsSection ('school' = all courses). */
	metricsScope: DashboardMetricsScope;
	/** Courses feeding CoursesOverview ('none' when the view has none). */
	coursesScope: DashboardCoursesScope;
	/** Spanish header copy (displayed by the demo-only panels). */
	headerTitle: string;
	headerSubtitle: string;
}

export const DASHBOARD_CONFIGS: Record<Roles, RoleDashboardConfig> = {
	[ROLES.SUPERADMIN]: {
		view: 'superadmin-analytics',
		metricsScope: 'school',
		coursesScope: 'none',
		headerTitle: 'Panel de Administración',
		headerSubtitle: 'Analíticas generales de la plataforma.',
	},
	[ROLES.ADMIN]: {
		view: 'preceptor-panel',
		metricsScope: 'school',
		coursesScope: 'school',
		headerTitle: 'Panel Institucional',
		headerSubtitle: 'Métricas de asistencia del colegio.',
	},
	[ROLES.PRECEPTOR]: {
		view: 'preceptor-panel',
		metricsScope: 'own',
		coursesScope: 'own',
		headerTitle: 'Panel de Preceptoría',
		headerSubtitle: 'Asistencia y ausencias de tus cursos.',
	},
	[ROLES.TEACHER]: {
		view: 'teacher-panel',
		metricsScope: 'own',
		coursesScope: 'own',
		headerTitle: 'Mis cursos',
		headerSubtitle: 'Resumen de asistencia de tus materias.',
	},
};

export function getDashboardConfig(role: Roles): RoleDashboardConfig {
	return DASHBOARD_CONFIGS[role];
}
