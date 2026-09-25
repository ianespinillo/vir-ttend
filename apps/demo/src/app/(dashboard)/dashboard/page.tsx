'use client';

/**
 * Demo dashboard — the landing page inside the authenticated shell.
 *
 * Welcomes the session user and points to the sidebar and the role switcher
 * in the topbar. Module content lives behind the sidebar links.
 */

import { useDemo } from '@/lib/session/demo-provider';
import { ROLE_BADGE_VARIANTS, ROLE_LABELS } from '@/lib/session/helpers';
import {
	Badge,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@repo/ui';

export default function DashboardPage() {
	const { session } = useDemo();

	if (!session.user) {
		return null;
	}

	const { firstName, role } = session.user;
	const scope = session.tenant?.name ?? 'Plataforma';

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-semibold tracking-tight">Hola, {firstName}</h1>
				<p className="mt-1 text-sm text-muted-foreground">Vista previa de ventas</p>
			</div>

			<Card className="shadow-sm">
				<CardHeader>
					<div className="flex items-center gap-2">
						<CardTitle>Tu sesión demo</CardTitle>
						<Badge
							variant={ROLE_BADGE_VARIANTS[role]}
							className="text-[10px] px-1.5 py-0 font-normal capitalize"
						>
							{ROLE_LABELS[role]}
						</Badge>
					</div>
					<CardDescription>{scope}</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-sm leading-relaxed text-muted-foreground">
						Explorá los módulos desde la barra lateral y cambiá de perfil con el
						selector de usuario en la barra superior. «Reset demo» vuelve a los datos
						de ejemplo originales.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
