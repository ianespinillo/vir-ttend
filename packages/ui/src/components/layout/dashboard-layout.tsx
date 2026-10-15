'use client';

import { type CurrentUser, ROLES, type Roles, type Tenant } from '@repo/common';
import { type ReactNode, useMemo } from 'react';
import { SidebarInset, SidebarProvider } from '../../ui/sidebar';
import { TourProvider, TourTriggerButton, buildTourSteps } from '../tour';
import { AlertBadgePlaceholder } from './alert-badge-placeholder';
import { AppSidebar } from './app-sidebar';
import { ImpersonationBanner } from './impersonation-banner';
import type { LayoutLinkComponent } from './link-component';
import { Topbar } from './topbar';
import { UserMenu } from './user-menu';

export interface DashboardTourOptions {
	/** Whose "tour seen" flag this is, e.g. `${userId}:${role}`. */
	storageKey: string;
	/** While false the tour neither starts nor stays open. */
	enabled?: boolean;
	/** Navigation entries the host app cannot open. */
	excludeHrefs?: string[];
}

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
	isImpersonating?: boolean;
	tenantName?: string;
	currentTenantId?: string;
	tenants?: Tenant[];
	onSelectTenant?: (tenantId: string) => void;
	onExitImpersonation?: () => void;
	isExitingImpersonation?: boolean;
	tenancyMode?: 'multi' | 'single';
	/** Onboarding tour of the role; omitted, the layout shows no tour. */
	tour?: DashboardTourOptions;
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
	isImpersonating,
	tenantName,
	currentTenantId,
	tenants,
	tenancyMode = 'multi',
	onSelectTenant,
	onExitImpersonation,
	isExitingImpersonation,
	tour,
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

	const excludeKey = tour?.excludeHrefs?.join('|') ?? '';
	const tourSteps = useMemo(
		() =>
			buildTourSteps(role, {
				tenancyMode,
				excludeHrefs: excludeKey ? excludeKey.split('|') : [],
			}),
		[role, tenancyMode, excludeKey],
	);

	const activeTenantId =
		currentTenantId ??
		('tenantId' in user ? (user.tenantId ?? undefined) : undefined);

	const shell = (
		<SidebarProvider>
			<AppSidebar
				role={role}
				tenancyMode={tenancyMode}
				user={user}
				currentPath={currentPath}
				onNavigate={onNavigate}
				LinkComponent={LinkComponent}
				brandName={tenantName || 'Vir-ttend'}
				tenants={tenants}
				currentTenantId={activeTenantId}
				isSuperAdmin={role === ROLES.SUPERADMIN || isImpersonating}
				isImpersonating={isImpersonating}
				onSelectTenant={onSelectTenant}
				onExitToGlobal={onExitImpersonation}
			/>
			<SidebarInset className="flex flex-col min-h-screen">
				{isImpersonating && (
					<ImpersonationBanner
						tenantName={tenantName}
						onExit={onExitImpersonation}
						isExiting={isExitingImpersonation}
					/>
				)}
				<Topbar
					title={title}
					actions={
						<>
							{tour && <TourTriggerButton />}
							{actions ?? defaultActions}
						</>
					}
				/>
				<main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
					{children}
				</main>
			</SidebarInset>
		</SidebarProvider>
	);

	if (!tour) return shell;

	return (
		<TourProvider
			steps={tourSteps}
			storageKey={tour.storageKey}
			enabled={tour.enabled ?? true}
			currentPath={currentPath}
			onNavigate={onNavigate}
		>
			{shell}
		</TourProvider>
	);
}
