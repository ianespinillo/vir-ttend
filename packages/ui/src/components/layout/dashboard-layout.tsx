'use client';

import type { CurrentUser, Roles } from '@repo/common';
import type { ReactNode } from 'react';
import { SidebarInset, SidebarProvider } from '../../ui/sidebar';
import { AlertBadgePlaceholder } from './alert-badge-placeholder';
import { AppSidebar } from './app-sidebar';
import type { LayoutLinkComponent } from './link-component';
import { Topbar } from './topbar';
import { UserMenu } from './user-menu';

export interface DashboardLayoutProps {
	role: Roles;
	user:
		| CurrentUser
		| { firstName: string; lastName: string; email: string; role: Roles };
	currentPath: string;
	onLogout: () => void;
	children: ReactNode;
	title?: string;
	actions?: ReactNode;
	LinkComponent?: LayoutLinkComponent;
	onNavigate?: (href: string) => void;
	alertCount?: number;
}

export function DashboardLayout({
	role,
	user,
	currentPath,
	onLogout,
	children,
	title,
	actions,
	LinkComponent,
	onNavigate,
	alertCount,
}: DashboardLayoutProps) {
	const defaultActions = (
		<>
			<AlertBadgePlaceholder
				count={alertCount}
				onClick={() => onNavigate?.('/alerts')}
			/>
			<UserMenu
				user={user}
				onLogout={onLogout}
				onNavigate={onNavigate}
				LinkComponent={LinkComponent}
			/>
		</>
	);

	return (
		<SidebarProvider>
			<AppSidebar
				role={role}
				currentPath={currentPath}
				onNavigate={onNavigate}
				LinkComponent={LinkComponent}
			/>
			<SidebarInset className="flex flex-col min-h-screen">
				<Topbar title={title} actions={actions ?? defaultActions} />
				<main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
					{children}
				</main>
			</SidebarInset>
		</SidebarProvider>
	);
}
