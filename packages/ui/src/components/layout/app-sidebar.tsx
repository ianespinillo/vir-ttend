'use client';

import { type Roles, getNavConfig } from '@repo/common';
import { School } from 'lucide-react';
import {
	Sidebar,
	SidebarContent,
	SidebarHeader,
	SidebarRail,
} from '../../ui/sidebar';
import type { LayoutLinkComponent } from './link-component';
import { NavGroup } from './nav-group';

export interface AppSidebarProps {
	role: Roles;
	currentPath: string;
	onNavigate?: (href: string) => void;
	LinkComponent?: LayoutLinkComponent;
	brandName?: string;
}

export function AppSidebar({
	role,
	currentPath,
	onNavigate,
	LinkComponent,
	brandName = 'Vir-ttend',
}: AppSidebarProps) {
	const groups = getNavConfig(role);

	return (
		<Sidebar collapsible="icon">
			<SidebarHeader className="border-b border-sidebar-border px-4 py-3">
				<div className="flex items-center gap-3 font-semibold text-sidebar-foreground">
					<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
						<School className="h-5 w-5" />
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
			<SidebarRail />
		</Sidebar>
	);
}
