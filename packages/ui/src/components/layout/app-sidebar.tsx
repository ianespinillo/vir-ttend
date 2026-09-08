'use client';

import { type Roles, getNavConfig } from '@repo/common';
import { School } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarRail,
} from '../../ui/sidebar';
import type { LayoutLinkComponent } from './link-component';
import { NavGroup } from './nav-group';

export interface AppSidebarProps {
	role: Roles;
	user?: {
		firstName?: string;
		lastName?: string;
		email?: string;
		role?: Roles;
		avatarUrl?: string;
	};
	currentPath: string;
	onNavigate?: (href: string) => void;
	LinkComponent?: LayoutLinkComponent;
	brandName?: string;
}

export function AppSidebar({
	role,
	user,
	currentPath,
	onNavigate,
	LinkComponent,
	brandName = 'Vir-ttend',
}: AppSidebarProps) {
	const groups = getNavConfig(role);

	return (
		<Sidebar collapsible="icon">
			<SidebarHeader className="border-b border-sidebar-border px-4 py-3 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center">
				<div className="flex items-center gap-3 font-semibold text-sidebar-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0">
					<div className="flex size-8 shrink-0 aspect-square items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
						<School className="h-4 w-4" />
					</div>
					<div className="flex flex-col group-data-[collapsible=icon]:hidden">
						<span className="text-base font-bold leading-tight tracking-tight">
							{brandName}
						</span>
						<span className="text-xs text-muted-foreground font-normal">
							Gestión Escolar
						</span>
					</div>
				</div>
			</SidebarHeader>
			<SidebarContent className="py-2">
				{groups.map((group, index) => (
					<NavGroup
						key={group.label || `group-${index}`}
						group={group}
						currentPath={currentPath}
						onNavigate={onNavigate}
						LinkComponent={LinkComponent}
					/>
				))}
			</SidebarContent>
			{user && (
				<SidebarFooter className="border-t border-sidebar-border p-3 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center">
					<button
						type="button"
						onClick={() => onNavigate?.('/settings/profile')}
						className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-sidebar-accent group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
						title={
							`${user.firstName || ''} ${user.lastName || ''}`.trim() ||
							user.email ||
							'Mi perfil'
						}
					>
						<Avatar className="size-8 shrink-0 aspect-square border border-primary/30 shadow-xs">
							{user.avatarUrl && (
								<AvatarImage src={user.avatarUrl} alt={user.firstName} />
							)}
							<AvatarFallback className="bg-primary text-primary-foreground font-semibold text-xs">
								{`${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() ||
									'U'}
							</AvatarFallback>
						</Avatar>
						<div className="flex flex-col min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
							<span className="truncate text-sm font-semibold leading-tight text-sidebar-foreground">
								{`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email}
							</span>
							<span className="truncate text-xs text-muted-foreground uppercase font-medium">
								{user.role}
							</span>
						</div>
					</button>
				</SidebarFooter>
			)}
			<SidebarRail />
		</Sidebar>
	);
}
