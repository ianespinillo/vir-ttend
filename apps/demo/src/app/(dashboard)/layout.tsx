'use client';

/**
 * Authenticated shell for the demo.
 *
 * Mirrors the client's (dashboard) layout 1:1: renders the real
 * DashboardLayout (nav built internally from the session role), replaces the
 * product's user menu with the demo session controls (role switcher + reset),
 * and guards children with the shared isPathAllowedForRole rule.
 *
 * Without a session (after exit/reset or on a stale URL) it redirects to '/'.
 */

import { useDemo } from '@/lib/session/demo-provider';
import { DemoSessionControls } from '@/lib/session/demo-session-controls';
import { APP_ROUTES, isPathAllowedForRole } from '@repo/common';
import { DashboardLayout, Forbidden, LoadingSpinner } from '@repo/ui';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardLayoutRoute({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	const { state, session } = useDemo();
	const router = useRouter();
	const pathname = usePathname();

	const user = session.user;

	useEffect(() => {
		if (!user) {
			router.replace('/');
		}
	}, [user, router]);

	if (!user) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<LoadingSpinner className="h-8 w-8" label="Cargando…" />
			</div>
		);
	}

	const tenant = session.tenant;
	const { firstName, lastName, email, role, tenantId } = user;
	const canOpenPath = isPathAllowedForRole(pathname, role);

	return (
		<DashboardLayout
			role={role}
			user={{ firstName, lastName, email, role }}
			currentPath={pathname}
			onLogout={() => router.push('/')}
			LinkComponent={Link}
			onNavigate={(href) => router.push(href)}
			currentTenantId={tenantId ?? undefined}
			tenantName={tenant?.name}
			actions={<DemoSessionControls />}
		>
			{canOpenPath ? (
				children
			) : (
				<Forbidden onBack={() => router.push(APP_ROUTES.dashboard)} />
			)}
		</DashboardLayout>
	);
}
