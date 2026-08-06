'use client';

import type { NavGroupConfig } from '@repo/common';
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
} from '../../ui/sidebar';
import type { LayoutLinkComponent } from './link-component';
import { NavItem } from './nav-item';

export interface NavGroupProps {
	group: NavGroupConfig;
	currentPath: string;
	onNavigate?: (href: string) => void;
	LinkComponent?: LayoutLinkComponent;
}

export function NavGroup({
	group,
	currentPath,
	onNavigate,
	LinkComponent,
}: NavGroupProps) {
	return (
		<SidebarGroup>
			{group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
			<SidebarGroupContent>
				<SidebarMenu>
					{group.items.map((item) => (
						<NavItem
							key={`${item.href}-${item.label}`}
							item={item}
							currentPath={currentPath}
							onNavigate={onNavigate}
							LinkComponent={LinkComponent}
						/>
					))}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}
