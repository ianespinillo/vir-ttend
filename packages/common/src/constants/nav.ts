import { APP_ROUTES } from '../routes/app.routes.js';
import type { Roles } from './roles.enum.js';
import { ROLES } from './roles.enum.js';

export interface NavItemConfig {
	label: string;
	href: string;
	icon: string;
	roles: Roles[];
	exact?: boolean;
}

export interface NavGroupConfig {
	label?: string;
	items: NavItemConfig[];
}

export const ALL_NAV_ITEMS: NavItemConfig[] = [
	{
		label: 'Tenants',
		href: APP_ROUTES.tenants,
		icon: 'Building2',
		roles: [ROLES.SUPERADMIN],
	},
	{
		label: 'Dashboard',
		href: APP_ROUTES.dashboard,
		icon: 'LayoutDashboard',
		roles: [ROLES.ADMIN, ROLES.PRECEPTOR],
	},
	{
		label: 'Mis Materias',
		href: APP_ROUTES.attendanceSubject,
		icon: 'BookOpen',
		roles: [ROLES.TEACHER],
	},
	{
		label: 'Cursos',
		href: APP_ROUTES.courses,
		icon: 'GraduationCap',
		roles: [ROLES.ADMIN, ROLES.PRECEPTOR],
	},
	{
		label: 'Estudiantes',
		href: APP_ROUTES.students,
		icon: 'Users',
		roles: [ROLES.ADMIN, ROLES.PRECEPTOR],
	},
	{
		label: 'Asistencia Diaria',
		href: APP_ROUTES.attendanceDaily,
		icon: 'CalendarCheck',
		roles: [ROLES.ADMIN, ROLES.PRECEPTOR],
	},
	{
		label: 'Asistencia por Materia',
		href: APP_ROUTES.attendanceSubject,
		icon: 'ClipboardList',
		roles: [ROLES.ADMIN, ROLES.PRECEPTOR],
	},
	{
		label: 'Alertas',
		href: APP_ROUTES.alerts,
		icon: 'Bell',
		roles: [ROLES.ADMIN, ROLES.PRECEPTOR],
	},
	{
		label: 'Reportes',
		href: APP_ROUTES.reports,
		icon: 'FileBarChart',
		roles: [ROLES.ADMIN, ROLES.PRECEPTOR],
	},
	{
		label: 'Comunicados',
		href: APP_ROUTES.announcements,
		icon: 'Megaphone',
		roles: [ROLES.ADMIN, ROLES.PRECEPTOR],
	},
	{
		label: 'Para mí',
		href: APP_ROUTES.meAnnouncements,
		icon: 'Inbox',
		roles: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.PRECEPTOR, ROLES.TEACHER],
	},
	{
		label: 'Usuarios',
		href: APP_ROUTES.users,
		icon: 'UserCog',
		roles: [ROLES.SUPERADMIN, ROLES.ADMIN],
	},
	{
		label: 'Perfil',
		href: APP_ROUTES.profile,
		icon: 'User',
		roles: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.PRECEPTOR, ROLES.TEACHER],
	},
];

export function getNavConfig(role: Roles): NavGroupConfig[] {
	const allowedItems = ALL_NAV_ITEMS.filter((item) => item.roles.includes(role));
	return [
		{
			items: allowedItems,
		},
	];
}

export function allowedRolesForPathname(pathname: string): Roles[] {
	if (pathname.startsWith('/tenants')) return [ROLES.SUPERADMIN];
	if (pathname === '/dashboard') return [ROLES.ADMIN, ROLES.PRECEPTOR];
	if (pathname.startsWith('/courses')) return [ROLES.ADMIN, ROLES.PRECEPTOR];
	if (pathname.startsWith('/students')) return [ROLES.ADMIN, ROLES.PRECEPTOR];
	if (pathname.startsWith('/attendance/daily'))
		return [ROLES.ADMIN, ROLES.PRECEPTOR];
	if (pathname.startsWith('/attendance/subject'))
		return [ROLES.ADMIN, ROLES.PRECEPTOR, ROLES.TEACHER];
	if (pathname.startsWith('/alerts')) return [ROLES.ADMIN, ROLES.PRECEPTOR];
	if (pathname.startsWith('/reports')) return [ROLES.ADMIN, ROLES.PRECEPTOR];
	if (pathname.startsWith('/me/announcements'))
		return [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.PRECEPTOR, ROLES.TEACHER];
	if (
		pathname === APP_ROUTES.announcements ||
		pathname === `${APP_ROUTES.announcements}/create` ||
		pathname.endsWith('/edit')
	)
		return [ROLES.ADMIN, ROLES.PRECEPTOR];
	if (pathname.startsWith(`${APP_ROUTES.announcements}/`))
		return [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.PRECEPTOR, ROLES.TEACHER];
	if (pathname.startsWith('/users')) return [ROLES.SUPERADMIN, ROLES.ADMIN];
	if (pathname.startsWith('/settings/profile'))
		return [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.PRECEPTOR, ROLES.TEACHER];
	if (pathname.startsWith('/settings')) return [ROLES.ADMIN];

	return [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.PRECEPTOR, ROLES.TEACHER];
}

export function requireRole(role: Roles, allowedRoles: Roles[]): boolean {
	return allowedRoles.includes(role);
}

export function isPathAllowedForRole(pathname: string, role: Roles): boolean {
	const allowed = allowedRolesForPathname(pathname);
	return allowed.includes(role);
}
