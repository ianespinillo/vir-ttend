'use client';

/**
 * Demo entry point — the role picker ("Entrar como…").
 *
 * The marketing landing lives in `apps/site`; this page only lets the visitor
 * pick one of the seeded institutional profiles and enter the demo.
 */

import { siteUrl } from '@/lib/config';
import { useDemo } from '@/lib/session/demo-provider';
import {
	PROFILE_DESCRIPTORS,
	ROLE_BADGE_VARIANTS,
	ROLE_LABELS,
	getDemoProfiles,
	getInitials,
} from '@/lib/session/helpers';
import { DEMO_DEFAULT_PASSWORD } from '@/lib/store/types';
import { APP_ROUTES } from '@repo/common';
import {
	Avatar,
	AvatarFallback,
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
	VirttendSeal,
} from '@repo/ui';
import { ArrowUpRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DemoRolesPage() {
	const { state, enterAs, resetDemo } = useDemo();
	const router = useRouter();
	const profiles = getDemoProfiles(state);

	const handleEnter = (profileId: string) => {
		const targetProfile = profiles.find((p) => p.user.id === profileId);
		enterAs(profileId);
		if (targetProfile?.user.role === 'teacher') {
			router.push(APP_ROUTES.attendanceSubject);
		} else {
			router.push(APP_ROUTES.dashboard);
		}
	};

	return (
		<div className="flex min-h-screen flex-col bg-background text-foreground">
			<header className="border-b">
				<div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-6">
					<div className="flex items-center gap-3">
						<VirttendSeal size={32} />
						<span className="text-lg font-extrabold tracking-tight text-primary">
							Vir-ttend
						</span>
						<Badge
							variant="secondary"
							className="px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wider"
						>
							Demo
						</Badge>
					</div>
					<Button variant="outline" size="sm" asChild>
						<a href={siteUrl}>
							Conocé Vir-ttend
							<ArrowUpRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
						</a>
					</Button>
				</div>
			</header>

			<main className="flex-1 py-12 sm:py-16">
				<div className="mx-auto w-full max-w-6xl px-6">
					<div className="mx-auto max-w-2xl text-center">
						<h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
							Demo de Vir-ttend — datos ficticios
						</h1>
						<p className="mt-3 text-muted-foreground">
							Elegí un perfil para recorrer la plataforma. Todo se ejecuta en tu
							navegador con datos de una escuela de ejemplo: no hace falta registrarse
							y nada se envía a un servidor. Podés cambiar de perfil en cualquier
							momento desde el menú superior.
						</p>
					</div>

					<div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{profiles.map((profile) => {
							const { user, tenantName } = profile;
							const displayName = `${user.firstName} ${user.lastName}`;
							return (
								<Card
									key={user.id}
									className="card-hover-lift group flex flex-col transition-all hover:border-primary/50"
								>
									<CardHeader>
										<div className="flex items-center gap-3">
											<Avatar className="h-11 w-11 transition-transform group-hover:scale-105">
												<AvatarFallback className="bg-primary/10 font-semibold text-primary">
													{getInitials(user.firstName, user.lastName)}
												</AvatarFallback>
											</Avatar>
											<div className="space-y-1">
												<CardTitle className="text-base">{displayName}</CardTitle>
												<Badge
													variant={ROLE_BADGE_VARIANTS[user.role]}
													className="px-1.5 py-0 text-[10px] font-normal capitalize"
												>
													{ROLE_LABELS[user.role]}
												</Badge>
											</div>
										</div>
									</CardHeader>
									<CardContent className="flex-1">
										<CardDescription className="text-sm font-medium text-foreground/80">
											{PROFILE_DESCRIPTORS[user.id]}
										</CardDescription>
										<p className="mt-2 text-xs text-muted-foreground">
											Institución: {tenantName ?? 'Colegio San Martín'}
										</p>
									</CardContent>
									<CardFooter>
										<Button
											className="w-full transition-all active:scale-95"
											onClick={() => handleEnter(user.id)}
										>
											Entrar como {user.firstName}
										</Button>
									</CardFooter>
								</Card>
							);
						})}
					</div>
				</div>
			</main>

			<footer className="border-t bg-muted/30">
				<div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6">
					<p className="text-xs text-muted-foreground">
						Contraseña demo:{' '}
						<code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] font-semibold text-foreground">
							{DEMO_DEFAULT_PASSWORD}
						</code>
					</p>
					<Button variant="outline" size="sm" onClick={resetDemo}>
						Reset demo
					</Button>
				</div>
			</footer>
		</div>
	);
}
