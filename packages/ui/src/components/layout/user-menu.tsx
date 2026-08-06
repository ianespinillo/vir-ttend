'use client';

import { APP_ROUTES, type Roles } from '@repo/common';
import { LogOut, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '../../ui/avatar';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '../../ui/dropdown-menu';
import type { LayoutLinkComponent } from './link-component';

export interface UserMenuProps {
	user: {
		firstName: string;
		lastName: string;
		email: string;
		role: Roles;
	};
	onLogout: () => void;
	onNavigate?: (href: string) => void;
	LinkComponent?: LayoutLinkComponent;
}

const ROLE_LABELS: Record<Roles, string> = {
	superadmin: 'Super Admin',
	admin: 'Administrador',
	preceptor: 'Preceptor',
	teacher: 'Docente',
};

const ROLE_BADGE_VARIANTS: Record<
	Roles,
	'default' | 'secondary' | 'outline' | 'destructive'
> = {
	superadmin: 'destructive',
	admin: 'default',
	preceptor: 'secondary',
	teacher: 'outline',
};

export function UserMenu({
	user,
	onLogout,
	onNavigate,
	LinkComponent,
}: UserMenuProps) {
	const initials =
		`${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() ||
		'U';
	const fullName = `${user.firstName} ${user.lastName}`.trim() || user.email;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					className="relative h-9 rounded-full px-2 py-1 flex items-center gap-2 hover:bg-accent"
				>
					<Avatar className="h-8 w-8">
						<AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
							{initials}
						</AvatarFallback>
					</Avatar>
					<div className="hidden md:flex flex-col text-left">
						<span className="text-xs font-semibold leading-tight">{fullName}</span>
						<span className="text-[10px] text-muted-foreground capitalize">
							{ROLE_LABELS[user.role] || user.role}
						</span>
					</div>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-56" align="end" forceMount>
				<DropdownMenuLabel className="font-normal">
					<div className="flex flex-col space-y-1">
						<p className="text-sm font-medium leading-none">{fullName}</p>
						<p className="text-xs leading-none text-muted-foreground">{user.email}</p>
						<div className="pt-1">
							<Badge
								variant={ROLE_BADGE_VARIANTS[user.role] || 'outline'}
								className="text-[10px] px-1.5 py-0 font-normal capitalize"
							>
								{ROLE_LABELS[user.role] || user.role}
							</Badge>
						</div>
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					{LinkComponent ? (
						<DropdownMenuItem asChild>
							<LinkComponent
								href={APP_ROUTES.profile}
								className="flex items-center cursor-pointer"
							>
								<User className="mr-2 h-4 w-4" />
								<span>Perfil</span>
							</LinkComponent>
						</DropdownMenuItem>
					) : (
						<DropdownMenuItem onClick={() => onNavigate?.(APP_ROUTES.profile)}>
							<User className="mr-2 h-4 w-4" />
							<span>Perfil</span>
						</DropdownMenuItem>
					)}
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					onClick={onLogout}
					className="text-destructive focus:text-destructive cursor-pointer"
				>
					<LogOut className="mr-2 h-4 w-4" />
					<span>Cerrar sesión</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
