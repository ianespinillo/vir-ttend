'use client';

/**
 * Public landing — the demo entry point.
 *
 * Lists the six seeded profiles ("Entrar como…") and the reset affordance.
 * Entering a profile sets the session and routes the user to /dashboard.
 */

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
} from '@repo/ui';
import { useRouter } from 'next/navigation';

export default function HomePage() {
	const { state, enterAs, resetDemo } = useDemo();
	const router = useRouter();
	const profiles = getDemoProfiles(state);

	const handleEnter = (profileId: string) => {
		enterAs(profileId);
		router.push(APP_ROUTES.dashboard);
	};

	const handleReset = () => {
		resetDemo();
	};

	return (
		<div className="flex min-h-screen flex-col">
			<header className="border-b">
				<div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-6">
					<div className="flex items-center gap-2">
						<span className="text-lg font-semibold tracking-tight">Vir-ttend</span>
						<Badge variant="outline" className="text-[10px] font-semibold uppercase">
							Demo
						</Badge>
					</div>
					<span className="text-sm text-muted-foreground">
						Ventas — gestión de asistencia escolar
					</span>
				</div>
			</header>

			<main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-12">
				<div className="mb-10 space-y-3">
					<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
						Explora Vir-ttend sin registrarte
					</h1>
					<p className="max-w-2xl text-base text-muted-foreground">
						Elegí un perfil para entrar como ese usuario y explorar los módulos. Podés
						cambiar de perfil en cualquier momento desde la barra superior y
						restablecer los datos de ejemplo con «Reset demo».
					</p>
				</div>

				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{profiles.map((profile) => {
						const { user, tenantName } = profile;
						const displayName = `${user.firstName} ${user.lastName}`;
						return (
							<Card key={user.id} className="flex flex-col">
								<CardHeader>
									<div className="flex items-center gap-3">
										<Avatar className="h-10 w-10">
											<AvatarFallback className="bg-primary/10 font-medium text-primary">
												{getInitials(user.firstName, user.lastName)}
											</AvatarFallback>
										</Avatar>
										<div className="space-y-1">
											<CardTitle className="text-base">{displayName}</CardTitle>
											<Badge
												variant={ROLE_BADGE_VARIANTS[user.role]}
												className="text-[10px] px-1.5 py-0 font-normal capitalize"
											>
												{ROLE_LABELS[user.role]}
											</Badge>
										</div>
									</div>
								</CardHeader>
								<CardContent className="flex-1">
									<CardDescription className="text-sm">
										{PROFILE_DESCRIPTORS[user.id]}
									</CardDescription>
									<p className="mt-2 text-xs text-muted-foreground">
										{tenantName ?? 'Plataforma'}
									</p>
								</CardContent>
								<CardFooter>
									<Button
										variant="outline"
										size="sm"
										className="w-full"
										onClick={() => handleEnter(user.id)}
									>
										Entrar como {user.firstName}
									</Button>
								</CardFooter>
							</Card>
						);
					})}
				</div>
			</main>

			<footer className="border-t">
				<div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-6">
					<p className="text-xs text-muted-foreground">
						Contraseña demo:{' '}
						<span className="font-medium">{DEMO_DEFAULT_PASSWORD}</span>
					</p>
					<Button variant="outline" size="sm" onClick={handleReset}>
						Reset demo
					</Button>
				</div>
			</footer>
		</div>
	);
}
