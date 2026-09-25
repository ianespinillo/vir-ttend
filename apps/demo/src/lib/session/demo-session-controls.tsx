'use client';

/**
 * Demo session controls — the topbar actions that replace the product's
 * user menu (logout) inside the real DashboardLayout:
 *  - a role switcher: enter the demo as any of the six profiles on the fly;
 *  - a "Reset demo" button: restore the canonical seeded state.
 */

import { APP_ROUTES, type Roles, isPathAllowedForRole } from '@repo/common';
import {
	Avatar,
	AvatarFallback,
	Badge,
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@repo/ui';
import { usePathname, useRouter } from 'next/navigation';
import { DEMO_DEFAULT_PASSWORD } from '../store/types';
import { useDemo } from './demo-provider';
import {
	PROFILE_DESCRIPTORS,
	ROLE_BADGE_VARIANTS,
	ROLE_LABELS,
	getDemoProfiles,
	getInitials,
} from './helpers';

export function DemoSessionControls() {
	const { state, session, enterAs, exitSession, resetDemo } = useDemo();
	const router = useRouter();
	const pathname = usePathname();

	const currentUser = session.user;
	const profiles = getDemoProfiles(state);

	if (!currentUser) {
		return null;
	}

	const displayName = `${currentUser.firstName} ${currentUser.lastName}`.trim();
	const initials = getInitials(currentUser.firstName, currentUser.lastName);

	const handleEnter = (profileId: string, role: Roles) => {
		enterAs(profileId);
		// Land on a page the new role can actually open (the layout guards
		// children with isPathAllowedForRole, mirroring the client shell).
		if (!isPathAllowedForRole(pathname, role)) {
			router.push(APP_ROUTES.dashboard);
		}
	};

	const handleReset = () => {
		resetDemo();
		router.push('/');
	};

	const handleExit = () => {
		exitSession();
		router.push('/');
	};

	return (
		<div className="flex items-center gap-2">
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
							<span className="text-xs font-semibold leading-tight">
								{displayName}
							</span>
							<span className="text-[10px] text-muted-foreground capitalize">
								{ROLE_LABELS[currentUser.role] || currentUser.role}
							</span>
						</div>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent className="w-80" align="end" forceMount>
					<DropdownMenuLabel className="font-normal">
						<div className="flex flex-col space-y-1">
							<p className="text-sm font-medium leading-none">{displayName}</p>
							<p className="text-xs leading-none text-muted-foreground">
								{currentUser.email}
							</p>
							<div className="pt-1">
								<Badge
									variant={ROLE_BADGE_VARIANTS[currentUser.role]}
									className="text-[10px] px-1.5 py-0 font-normal capitalize"
								>
									{ROLE_LABELS[currentUser.role] || currentUser.role}
								</Badge>
							</div>
						</div>
					</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground">
						Entrar como…
					</DropdownMenuLabel>
					{profiles.map((profile) => {
						const isCurrent = profile.user.id === currentUser.id;
						return (
							<DropdownMenuItem
								key={profile.user.id}
								disabled={isCurrent}
								onClick={() => handleEnter(profile.user.id, profile.user.role)}
								className="flex items-center gap-3 cursor-pointer"
							>
								<Avatar className="h-7 w-7">
									<AvatarFallback className="bg-primary/10 text-primary text-[10px] font-medium">
										{getInitials(profile.user.firstName, profile.user.lastName)}
									</AvatarFallback>
								</Avatar>
								<div className="flex min-w-0 flex-1 flex-col">
									<span className="truncate text-sm font-medium">
										{`${profile.user.firstName} ${profile.user.lastName}`}
									</span>
									<span className="truncate text-xs text-muted-foreground">
										{PROFILE_DESCRIPTORS[profile.user.id] ??
											ROLE_LABELS[profile.user.role]}
									</span>
								</div>
								{isCurrent ? (
									<span className="text-[10px] font-semibold uppercase text-primary">
										Actual
									</span>
								) : null}
							</DropdownMenuItem>
						);
					})}
					<DropdownMenuSeparator />
					<DropdownMenuItem onClick={handleExit} className="cursor-pointer">
						Salir de la sesión demo
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<div className="px-2 py-1.5 text-[10px] text-muted-foreground">
						Contraseña demo: {DEMO_DEFAULT_PASSWORD}
					</div>
				</DropdownMenuContent>
			</DropdownMenu>
			<Button
				variant="outline"
				size="sm"
				onClick={handleReset}
				title="Restaura los datos de ejemplo"
			>
				Reset demo
			</Button>
		</div>
	);
}
