'use client';

import { useAuth } from '@/lib/auth/provider';
import { APP_ROUTES, ROLES, type Roles } from '@repo/common';
import { PageHeader } from '@repo/ui';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const HOME_BY_ROLE: Record<Roles, string> = {
	[ROLES.SUPERADMIN]: APP_ROUTES.tenants,
	[ROLES.ADMIN]: APP_ROUTES.dashboard,
	[ROLES.PRECEPTOR]: APP_ROUTES.dashboard,
	[ROLES.TEACHER]: APP_ROUTES.attendanceSubject,
};

export default function DashboardPage() {
	const { user } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (user && user.role !== ROLES.ADMIN && user.role !== ROLES.PRECEPTOR) {
			const target = HOME_BY_ROLE[user.role];
			if (target && target !== APP_ROUTES.dashboard) {
				router.replace(target);
			}
		}
	}, [user, router]);

	if (!user) return null;

	if (user.role === ROLES.SUPERADMIN || user.role === ROLES.TEACHER) {
		return null;
	}

	return (
		<div className="space-y-6">
			<PageHeader
				title={`¡Bienvenido/a, ${user.firstName}!`}
				description="Panel de control principal de gestión de asistencia y cursos."
			/>
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				<div className="rounded-xl border bg-card text-card-foreground p-6 shadow-sm">
					<h3 className="text-lg font-semibold tracking-tight">Acceso Rápido</h3>
					<p className="text-sm text-muted-foreground mt-2">
						Selecciona un módulo del menú lateral para comenzar la gestión de cursos,
						estudiantes o asistencias.
					</p>
				</div>
			</div>
		</div>
	);
}
