'use client';

/**
 * Public landing — the introductory demo entry point.
 *
 * Presents the value proposition of Vir-ttend (attendance, alerts, reports,
 * communication), platform highlights, comparison with traditional paper methods,
 * interactive institutional profile cards ("Entrar como…"), landing FAQ preview,
 * and clear CTA banners.
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
	AlertTriangle,
	Avatar,
	AvatarFallback,
	Badge,
	BarChart3,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
	CheckCircle,
	Clock,
	Shield,
	Smartphone,
	Users,
} from '@repo/ui';
import {
	ArrowRight,
	Bell,
	Check,
	ChevronDown,
	FileSpreadsheet,
	HelpCircle,
	Layers,
	Sparkles,
	X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const TOP_FAQS = [
	{
		id: 'faq-1',
		question: '¿Qué es Vir-ttend y cómo ayuda a mi colegio?',
		answer:
			'Vir-ttend es una plataforma integral de gestión de presentismo y alertas tempranas diseñada para escuelas de nivel inicial, primario y secundario. Reemplaza las planillas de papel, automatiza los cómputos de inasistencias y avisa a preceptores y directivos antes de que los alumnos queden en condición de libres.',
	},
	{
		id: 'faq-2',
		question: '¿Cómo funciona esta demostración interactiva?',
		answer:
			'La demo se ejecuta completamente en tu navegador con datos precargados realistas de un colegio ficticio. Podés ingresar con perfiles de dirección, preceptoría o docentes, registrar presentismo, justificar faltas y emitir comunicados. No necesitás registrarte ni ingresar datos personales.',
	},
	{
		id: 'faq-3',
		question:
			'¿Se diferencia la asistencia diaria institucional de la asistencia por materia?',
		answer:
			'Sí. El sistema permite registrar la asistencia diaria general (generalmente tomada por preceptoría al inicio de la jornada) y la asistencia específica por materia o módulo pedagógico (tomada por el docente). Ambas se articulan en el legajo del estudiante.',
	},
	{
		id: 'faq-4',
		question: '¿Cómo se configuran los umbrales de alerta temprana?',
		answer:
			'Cada ciclo lectivo permite parametrizar los umbrales de advertencia (por ejemplo, 15% de inasistencias) y crítico (25%). El sistema calcula los porcentajes sobre los días hábiles y emite notificaciones preventivas para posibilitar una intervención temprana.',
	},
];

export default function HomePage() {
	const { state, enterAs, resetDemo } = useDemo();
	const router = useRouter();
	const profiles = getDemoProfiles(state);
	const [openFaq, setOpenFaq] = useState<string | null>('faq-1');

	const handleEnter = (profileId: string) => {
		enterAs(profileId);
		router.push(APP_ROUTES.dashboard);
	};

	const handleReset = () => {
		resetDemo();
	};

	const scrollToRoles = () => {
		const el = document.getElementById('demo-roles');
		if (el) {
			el.scrollIntoView({ behavior: 'smooth' });
		}
	};

	return (
		<div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary/20">
			{/* Top Announcement Banner */}
			<div className="bg-primary/10 border-b border-primary/20 py-2 px-4 text-center text-xs font-medium text-foreground flex items-center justify-center gap-2">
				<Sparkles className="h-3.5 w-3.5 text-primary" />
				<span>
					Estás explorando la <strong>Demo Interactiva de Ventas</strong> de
					Vir-ttend. Probá todos los roles institucionales en vivo.
				</span>
			</div>

			{/* Navigation Header */}
			<header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
					<div className="flex items-center gap-3">
						<span className="text-xl font-black tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
							Vir-ttend
						</span>
						<Badge
							variant="secondary"
							className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0"
						>
							Demo
						</Badge>
					</div>

					<nav className="flex items-center gap-5">
						<a
							href="#caracteristicas"
							className="nav-link hidden text-sm font-medium text-muted-foreground transition hover:text-foreground md:inline-block"
						>
							Características
						</a>
						<a
							href="#comparativa"
							className="nav-link hidden text-sm font-medium text-muted-foreground transition hover:text-foreground md:inline-block"
						>
							Comparativa
						</a>
						<a
							href="#como-funciona"
							className="nav-link hidden text-sm font-medium text-muted-foreground transition hover:text-foreground md:inline-block"
						>
							Cómo funciona
						</a>
						<Link
							href="/faq"
							className="nav-link text-sm font-medium text-muted-foreground transition hover:text-foreground"
						>
							FAQ
						</Link>
						<Button
							variant="outline"
							size="sm"
							onClick={handleReset}
							className="transition-all active:scale-95 hover:bg-muted"
						>
							Reset demo
						</Button>
						<Button
							size="sm"
							onClick={scrollToRoles}
							className="transition-all active:scale-95 shadow-sm hover:shadow hover:brightness-105"
						>
							Probar ahora
						</Button>
					</nav>
				</div>
			</header>

			<main className="flex-1">
				{/* Hero Section */}
				<section className="relative overflow-hidden border-b bg-gradient-to-b from-muted/50 via-background to-background py-16 sm:py-24">
					<div className="mx-auto max-w-6xl px-6 text-center">
						<div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3.5 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur mb-6">
							<span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
							<span>Plataforma de gestión de asistencia escolar</span>
							<span className="text-muted-foreground/60">·</span>
							<span className="text-primary font-semibold">100% interactiva</span>
						</div>

						<h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-balance">
							Gestión moderna de asistencia y alertas tempranas para tu colegio
						</h1>

						<p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed text-balance">
							Digitalizá el control diario de presentismo, prevení el ausentismo
							recurrente con detección automática y agilizá la comunicación
							institucional. Sin planillas en papel y sin instalar nada.
						</p>

						<div className="mt-8 flex flex-wrap items-center justify-center gap-4">
							<Button
								size="lg"
								onClick={scrollToRoles}
								className="px-8 gap-2 shadow-sm"
							>
								<span>Explorar perfiles interactivos</span>
								<ArrowRight className="h-4 w-4" />
							</Button>
							<Button
								variant="outline"
								size="lg"
								onClick={() => router.push('/faq')}
								className="gap-2"
							>
								<HelpCircle className="h-4 w-4 text-muted-foreground" />
								<span>Preguntas frecuentes</span>
							</Button>
						</div>

						{/* Highlights Row */}
						<div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4 max-w-4xl mx-auto">
							<div className="card-hover-lift flex flex-col items-center justify-center p-3.5 rounded-xl border bg-card/60 text-center gap-1.5 transition-all">
								<CheckCircle className="h-5 w-5 text-emerald-500" />
								<span className="text-xs font-semibold">En tu navegador</span>
								<span className="text-[11px] text-muted-foreground">Sin descargas</span>
							</div>
							<div className="card-hover-lift flex flex-col items-center justify-center p-3.5 rounded-xl border bg-card/60 text-center gap-1.5 transition-all">
								<Shield className="h-5 w-5 text-primary" />
								<span className="text-xs font-semibold">Datos precargados</span>
								<span className="text-[11px] text-muted-foreground">
									Entorno seguro
								</span>
							</div>
							<div className="card-hover-lift flex flex-col items-center justify-center p-3.5 rounded-xl border bg-card/60 text-center gap-1.5 transition-all">
								<Smartphone className="h-5 w-5 text-blue-500" />
								<span className="text-xs font-semibold">Tablet y móvil</span>
								<span className="text-[11px] text-muted-foreground">
									Toma ágil en aula
								</span>
							</div>
							<div className="card-hover-lift flex flex-col items-center justify-center p-3.5 rounded-xl border bg-card/60 text-center gap-1.5 transition-all">
								<Clock className="h-5 w-5 text-amber-500" />
								<span className="text-xs font-semibold">Toma en 30 seg</span>
								<span className="text-[11px] text-muted-foreground">
									Ahorro de tiempo
								</span>
							</div>
						</div>

						{/* Live Product Preview Mockup */}
						<div className="mt-14 max-w-4xl mx-auto rounded-2xl border bg-card/90 shadow-2xl p-4 sm:p-6 backdrop-blur text-left transition-all">
							<div className="flex items-center justify-between pb-4 border-b border-border/80">
								<div className="flex items-center gap-2">
									<span className="h-3 w-3 rounded-full bg-rose-500/80 inline-block" />
									<span className="h-3 w-3 rounded-full bg-amber-500/80 inline-block" />
									<span className="h-3 w-3 rounded-full bg-emerald-500/80 inline-block" />
									<span className="ml-2 text-xs font-mono text-muted-foreground hidden sm:inline-block">
										Colegio San Martín · Panel de Asistencia
									</span>
								</div>
								<Badge variant="outline" className="text-xs font-normal">
									Ciclo Lectivo 2026
								</Badge>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
								<div className="card-hover-lift p-4 rounded-xl bg-muted/40 border transition-all">
									<div className="text-xs text-muted-foreground uppercase font-semibold">
										Presentismo general
									</div>
									<div className="text-3xl font-bold mt-1 text-emerald-600">92.4%</div>
									<div className="text-xs text-muted-foreground mt-1">
										182 alumnos presentes hoy
									</div>
								</div>
								<div className="card-hover-lift p-4 rounded-xl bg-muted/40 border transition-all">
									<div className="text-xs text-muted-foreground uppercase font-semibold">
										Alertas tempranas activas
									</div>
									<div className="text-3xl font-bold mt-1 text-amber-600">3</div>
									<div className="text-xs text-muted-foreground mt-1">
										2 en advertencia · 1 crítico
									</div>
								</div>
								<div className="card-hover-lift p-4 rounded-xl bg-muted/40 border transition-all">
									<div className="text-xs text-muted-foreground uppercase font-semibold">
										Cursos registrados
									</div>
									<div className="text-3xl font-bold mt-1 text-primary">6 / 6</div>
									<div className="text-xs text-muted-foreground mt-1">
										100% división del turno mañana
									</div>
								</div>
							</div>

							<div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20 flex flex-wrap items-center justify-between gap-3 text-xs">
								<span className="text-muted-foreground">
									Estado de alumnos simulado:{' '}
									<strong className="text-foreground">Presente (P)</strong>,{' '}
									<strong className="text-foreground">Ausente (A)</strong>,{' '}
									<strong className="text-foreground">Tarde (T)</strong>,{' '}
									<strong className="text-foreground">Justificado (J)</strong>.
								</span>
								<Button
									size="sm"
									variant="default"
									className="h-7 text-xs px-3"
									onClick={scrollToRoles}
								>
									Ver en la demo
								</Button>
							</div>
						</div>
					</div>
				</section>

				{/* Problem vs Solution Comparison Section */}
				<section id="comparativa" className="border-b py-16 sm:py-20 bg-muted/10">
					<div className="mx-auto max-w-6xl px-6">
						<div className="text-center max-w-3xl mx-auto">
							<Badge variant="outline" className="mb-2">
								Transformación operativa
							</Badge>
							<h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
								De la planilla de papel a la gestión en tiempo real
							</h2>
							<p className="mt-3 text-muted-foreground">
								Descubrí la diferencia de reemplazar los cuadernos de preceptoría por
								una herramienta ágil diseñada para el ritmo real de la escuela.
							</p>
						</div>

						<div className="mt-12 grid gap-6 md:grid-cols-2">
							{/* Traditional Way */}
							<Card className="card-hover-lift border-destructive/20 bg-destructive/5 transition-all">
								<CardHeader>
									<div className="flex items-center gap-2 text-destructive font-semibold text-sm">
										<X className="h-4 w-4" />
										<span>El método tradicional en papel</span>
									</div>
									<CardTitle className="text-xl">
										Fricción y falta de visibilidad
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-3 text-sm text-muted-foreground">
									<div className="flex items-start gap-2.5">
										<X className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
										<span>
											Planillas manuscritas que se traspapelan o sufren enmiendas.
										</span>
									</div>
									<div className="flex items-start gap-2.5">
										<X className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
										<span>
											Cálculo manual y tedioso de porcentajes de faltas a fin de mes.
										</span>
									</div>
									<div className="flex items-start gap-2.5">
										<X className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
										<span>
											Detección tardía: la dirección se entera cuando el alumno ya quedó
											libre.
										</span>
									</div>
									<div className="flex items-start gap-2.5">
										<X className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
										<span>
											Falta de acuse de recibo en las comunicaciones enviadas a las
											familias.
										</span>
									</div>
								</CardContent>
							</Card>

							{/* Vir-ttend Way */}
							<Card className="card-hover-lift border-emerald-500/30 bg-emerald-500/5 transition-all">
								<CardHeader>
									<div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm">
										<Check className="h-4 w-4" />
										<span>Con Vir-ttend</span>
									</div>
									<CardTitle className="text-xl">
										Eficiencia, claridad y anticipación
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-3 text-sm text-muted-foreground">
									<div className="flex items-start gap-2.5">
										<Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
										<span>
											Toma de asistencia en 30 segundos desde celular, tablet o PC.
										</span>
									</div>
									<div className="flex items-start gap-2.5">
										<Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
										<span>
											Cálculo automático de porcentajes de presentismo e inasistencias.
										</span>
									</div>
									<div className="flex items-start gap-2.5">
										<Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
										<span>
											Alertas tempranas preventivas configurables (15% y 25%) para
											intervenir a tiempo.
										</span>
									</div>
									<div className="flex items-start gap-2.5">
										<Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
										<span>
											Avisos segmentados con confirmación de lectura y registro de entrega.
										</span>
									</div>
								</CardContent>
							</Card>
						</div>
					</div>
				</section>

				{/* Value Pillars Section */}
				<section id="caracteristicas" className="border-b py-16 sm:py-20">
					<div className="mx-auto max-w-6xl px-6">
						<div className="text-center">
							<Badge variant="outline" className="mb-2">
								Módulos principales
							</Badge>
							<h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
								Todo lo que tu equipo necesita en una sola plataforma
							</h2>
							<p className="mt-2 text-muted-foreground">
								Herramientas pensadas para simplificar la jornada de directivos,
								preceptores y docentes.
							</p>
						</div>

						<div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
							<Card className="card-hover-lift flex flex-col transition-all border-border/70 hover:border-primary/40">
								<CardHeader>
									<div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
										<Clock className="h-5 w-5" />
									</div>
									<CardTitle className="text-lg">Asistencia en segundos</CardTitle>
								</CardHeader>
								<CardContent className="flex-1 text-sm text-muted-foreground">
									Toma diaria por curso o específica por materia. Carga ágil de
									justificaciones médicas y réplica rápida de estados entre jornadas.
								</CardContent>
							</Card>

							<Card className="card-hover-lift flex flex-col transition-all border-border/70 hover:border-primary/40">
								<CardHeader>
									<div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
										<AlertTriangle className="h-5 w-5" />
									</div>
									<CardTitle className="text-lg">Alertas tempranas</CardTitle>
								</CardHeader>
								<CardContent className="flex-1 text-sm text-muted-foreground">
									Detección proactiva de patrones de inasistencias críticas para
									intervenir a tiempo antes de que afecte la trayectoria escolar.
								</CardContent>
							</Card>

							<Card className="card-hover-lift flex flex-col transition-all border-border/70 hover:border-primary/40">
								<CardHeader>
									<div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
										<Bell className="h-5 w-5" />
									</div>
									<CardTitle className="text-lg">Comunicación directa</CardTitle>
								</CardHeader>
								<CardContent className="flex-1 text-sm text-muted-foreground">
									Difusión de avisos escolares segmentados por curso, nivel o rol
									institucional, con confirmación de lectura y registro de publicaciones.
								</CardContent>
							</Card>

							<Card className="card-hover-lift flex flex-col transition-all border-border/70 hover:border-primary/40">
								<CardHeader>
									<div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
										<BarChart3 className="h-5 w-5" />
									</div>
									<CardTitle className="text-lg">Analítica y reportes</CardTitle>
								</CardHeader>
								<CardContent className="flex-1 text-sm text-muted-foreground">
									Métricas mensuales consolidadas de presentismo, desglose por división y
									exportación inmediata de planillas oficiales.
								</CardContent>
							</Card>
						</div>
					</div>
				</section>

				{/* How It Works Section */}
				<section id="como-funciona" className="border-b py-16 sm:py-20 bg-muted/20">
					<div className="mx-auto max-w-6xl px-6">
						<div className="text-center max-w-3xl mx-auto">
							<Badge variant="outline" className="mb-2">
								Paso a paso
							</Badge>
							<h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
								¿Cómo experimentar la demo?
							</h2>
							<p className="mt-3 text-muted-foreground">
								Probá el sistema en 3 simples pasos sin necesidad de crear contraseñas
								ni cargar formularios previos.
							</p>
						</div>

						<div className="mt-12 grid gap-8 md:grid-cols-3">
							<div className="card-hover-lift flex flex-col items-center text-center p-6 rounded-xl border bg-card transition-all hover:border-primary/40">
								<div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg mb-4">
									1
								</div>
								<h3 className="font-semibold text-lg">Elegí tu rol escolar</h3>
								<p className="mt-2 text-sm text-muted-foreground">
									Seleccioná ingresar como Directora (visión completa), Preceptor
									(gestión diaria de división) o Docente (asistencia por materia).
								</p>
							</div>

							<div className="card-hover-lift flex flex-col items-center text-center p-6 rounded-xl border bg-card transition-all hover:border-primary/40">
								<div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg mb-4">
									2
								</div>
								<h3 className="font-semibold text-lg">Operá con datos reales</h3>
								<p className="mt-2 text-sm text-muted-foreground">
									Marcá asistencia con un clic, agregá justificaciones, probá la copia de
									estados y publicá un nuevo aviso institucional.
								</p>
							</div>

							<div className="card-hover-lift flex flex-col items-center text-center p-6 rounded-xl border bg-card transition-all hover:border-primary/40">
								<div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg mb-4">
									3
								</div>
								<h3 className="font-semibold text-lg">Comprobá el impacto</h3>
								<p className="mt-2 text-sm text-muted-foreground">
									Consultá cómo se actualizan instantáneamente los porcentajes en los
									reportes mensuales y el panel de alertas preventivas.
								</p>
							</div>
						</div>
					</div>
				</section>

				{/* Interactive Profiles Showcase */}
				<section id="demo-roles" className="border-b py-16 sm:py-20">
					<div className="mx-auto max-w-6xl px-6">
						<div className="text-center">
							<Badge variant="outline" className="mb-2">
								Perfiles interactivos
							</Badge>
							<h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
								Probá la plataforma según tu rol
							</h2>
							<p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground">
								Elegí un perfil institucional para experimentar las pantallas y flujos
								de trabajo reales. Podés alternar entre usuarios en cualquier momento
								desde el menú superior.
							</p>
						</div>

						<div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
							{profiles.map((profile) => {
								const { user, tenantName } = profile;
								const displayName = `${user.firstName} ${user.lastName}`;
								return (
									<Card
										key={user.id}
										className="card-hover-lift flex flex-col border-border/80 transition-all hover:border-primary/50 group"
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
												className="w-full transition-all active:scale-95 group-hover:brightness-105 shadow-sm"
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
				</section>

				{/* In-landing FAQ Section */}
				<section id="faq" className="border-b py-16 sm:py-20 bg-muted/10">
					<div className="mx-auto max-w-4xl px-6">
						<div className="text-center">
							<Badge variant="outline" className="mb-2">
								Preguntas frecuentes
							</Badge>
							<h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
								Respuestas rápidas para directivos y docentes
							</h2>
							<p className="mt-2 text-muted-foreground">
								Las dudas más habituales sobre la herramienta y la prueba interactiva.
							</p>
						</div>

						<div className="mt-10 space-y-3">
							{TOP_FAQS.map((faq) => {
								const isOpen = openFaq === faq.id;
								return (
									<div
										key={faq.id}
										className="card-hover-lift rounded-xl border bg-card text-card-foreground shadow-sm transition-all overflow-hidden"
									>
										<button
											type="button"
											className="w-full px-5 py-4 flex items-center justify-between text-left gap-4 hover:bg-muted/30 transition-colors"
											onClick={() => setOpenFaq(isOpen ? null : faq.id)}
										>
											<span className="font-semibold text-base">{faq.question}</span>
											<ChevronDown
												className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
													isOpen ? 'rotate-180 text-primary' : ''
												}`}
											/>
										</button>
										{isOpen && (
											<div className="animate-fade-in px-5 pb-4 pt-1 text-sm text-muted-foreground border-t bg-muted/5 leading-relaxed">
												{faq.answer}
											</div>
										)}
									</div>
								);
							})}
						</div>

						<div className="mt-8 text-center">
							<Button
								variant="outline"
								className="gap-2 transition-all active:scale-95 hover:bg-muted"
								onClick={() => router.push('/faq')}
							>
								<span>Ver todas las preguntas y respuestas</span>
								<ArrowRight className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</section>

				{/* Final Call to Action Banner */}
				<section className="py-16 sm:py-20 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-b">
					<div className="mx-auto max-w-5xl px-6 text-center space-y-6">
						<Badge variant="outline" className="px-3 py-1">
							Prueba sin compromiso
						</Badge>
						<h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-balance">
							Comenzá a explorar la gestión educativa moderna
						</h2>
						<p className="mx-auto max-w-2xl text-base text-muted-foreground">
							Probá cómo Vir-ttend puede transformar la dinámica cotidiana de tu
							colegio, evitar la deserción y ahorrar horas de trabajo administrativo.
						</p>
						<div className="flex flex-wrap items-center justify-center gap-4 pt-2">
							<Button size="lg" onClick={scrollToRoles} className="px-8 gap-2">
								<span>Probar demo interactiva</span>
								<ArrowRight className="h-4 w-4" />
							</Button>
							<Button variant="outline" size="lg" onClick={() => router.push('/faq')}>
								Centro de Preguntas
							</Button>
						</div>
					</div>
				</section>
			</main>

			{/* Footer */}
			<footer className="border-t bg-muted/30">
				<div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8">
					<div>
						<div className="flex items-center gap-2">
							<span className="font-semibold">Vir-ttend</span>
							<span className="text-xs text-muted-foreground">· Demo escolar</span>
						</div>
						<p className="mt-1 text-xs text-muted-foreground">
							Contraseña demo:{' '}
							<code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] font-semibold text-foreground">
								{DEMO_DEFAULT_PASSWORD}
							</code>
						</p>
					</div>

					<div className="flex items-center gap-4 text-xs text-muted-foreground">
						<Link href="/faq" className="hover:text-foreground transition-colors">
							Preguntas frecuentes
						</Link>
						<a
							href="#caracteristicas"
							className="hover:text-foreground transition-colors"
						>
							Características
						</a>
						<a href="#demo-roles" className="hover:text-foreground transition-colors">
							Perfiles
						</a>
						<Button variant="outline" size="sm" onClick={handleReset}>
							Reset demo
						</Button>
					</div>
				</div>
			</footer>
		</div>
	);
}
