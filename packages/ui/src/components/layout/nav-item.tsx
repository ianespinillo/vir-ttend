'use client';

import type { NavItemConfig } from '@repo/common';
import {
	Bell,
	BookOpen,
	Building2,
	CalendarCheck,
	ClipboardList,
	FileBarChart,
	GraduationCap,
	HelpCircle,
	LayoutDashboard,
	Megaphone,
	User,
	UserCog,
	Users,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { SidebarMenuButton, SidebarMenuItem } from '../../ui/sidebar';
import type { LayoutLinkComponent } from './link-component';

const ICON_MAP: Record<string, ComponentType<{ className?: string }>> = {
	Building2,
	LayoutDashboard,
	BookOpen,
	GraduationCap,
	Users,
	CalendarCheck,
	ClipboardList,
	Bell,
	FileBarChart,
	Megaphone,
	UserCog,
	User,
};

export interface NavItemProps {
	item: NavItemConfig;
	currentPath: string;
	onNavigate?: (href: string) => void;
	LinkComponent?: LayoutLinkComponent;
}

export function NavItem({
	item,
	currentPath,
	onNavigate,
	LinkComponent,
}: NavItemProps) {
	const IconComponent = ICON_MAP[item.icon] || HelpCircle;
	const isActive = item.exact
		? currentPath === item.href
		: currentPath === item.href ||
			(item.href !== '/dashboard' && currentPath.startsWith(item.href));

	const content = (
		<SidebarMenuButton
			isActive={isActive}
			tooltip={item.label}
			onClick={() => onNavigate?.(item.href)}
		>
			<IconComponent className="h-4 w-4 shrink-0" />
			<span className="truncate">{item.label}</span>
		</SidebarMenuButton>
	);

	if (LinkComponent) {
		return (
			<SidebarMenuItem>
				<LinkComponent href={item.href} className="w-full block">
					{content}
				</LinkComponent>
			</SidebarMenuItem>
		);
	}

	return <SidebarMenuItem>{content}</SidebarMenuItem>;
}
