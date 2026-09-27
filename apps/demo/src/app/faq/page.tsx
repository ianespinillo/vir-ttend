'use client';

/**
 * FAQ page — Preguntas frecuentes sobre Vir-ttend y la demo interactiva.
 */

import { DEMO_DEFAULT_PASSWORD } from '@/lib/store/types';
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Input,
} from '@repo/ui';
import {
	ArrowLeft,
	ArrowRight,
	CheckCircle,
	ChevronDown,
	HelpCircle,
	Search,
	Shield,
	Sparkles,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

interface FaqItem {
	id: string;
	category:
		| 'general'
		| 'asistencia'
		| 'alertas'
		| 'seguridad'
		| 'implementacion';
	question: string;
	answer: string;
	highlight?: string;
}

const FAQ_ITEMS: FaqItem[] = [
	{
		id: 'que-es',
		category: 'general',
		question: '¿Qué es Vir-ttend y para qué tipo de instituciones está pensado?',
		answer:
			'Vir-ttend es una plataforma integral de gestión de asistencia escolar y alertas tempranas de deserción o ausentismo. Está diseñada para colegios de nivel inicial, primario y secundario (tanto de gestión pública como privada), facilitando el trabajo diario de directivos, preceptores y docentes sin fricción técnica.',
		highlight: 'Diseñado para los tres niveles educativos',
	},
	{
		id: 'como-funciona-demo',
		category: 'general',
		question: '¿Cómo funciona esta demo interactiva?',
		answer:
			'La demo corre íntegramente en tu navegador utilizando un almacén de datos determinista simulado. No requiere registro, no instala nada y no envía información a servidores externos. Podés ingresar con cualquiera de los perfiles institucionales (directora, preceptores, profesores), registrar asistencias, emitir comunicados y consultar reportes. Si querés volver al estado original, hacé clic en «Reset demo».',
		highlight: '100% interactiva y sin registro',
	},
	{
		id: 'asistencia-diaria-vs-materia',
		category: 'asistencia',
		question:
			'¿Cómo se diferencia la asistencia diaria de la asistencia por materia?',
		answer:
			'El sistema contempla la doble dimensión operativa del colegio: la asistencia diaria institucional (generalmente tomada a primera hora por la preceptoría para constatar el ingreso al establecimiento) y la asistencia por materia/módulo pedagógico (tomada por el profesor en cada hora de clase). Ambas se integran sin duplicación de tareas y alimentan el legajo del alumno.',
	},
	{
		id: 'justificaciones-tardanzas',
		category: 'asistencia',
		question: '¿Cómo se gestionan las tardanzas y las justificaciones médicas?',
		answer:
			'Cada registro de inasistencia permite adjuntar un motivo de justificación (médica, personal, institucional) y observaciones. Además, las llegadas tarde se configuran según el reglamento del colegio: se puede parametrizar cuántos minutos de tardanza computan media falta o falta completa en el ciclo lectivo.',
		highlight: 'Cómputo paramétrico de medias faltas',
	},
	{
		id: 'alertas-riesgo',
		category: 'alertas',
		question:
			'¿Cómo detecta la plataforma los casos de riesgo o abandono potencial?',
		answer:
			'Vir-ttend supervisa continuamente los porcentajes acumulados de inasistencias en base a los días hábiles del ciclo lectivo. El sistema emite alertas preventivas cuando un estudiante alcanza el umbral de advertencia (por ejemplo, 15% de inasistencias) y alertas críticas (25%) antes de que el estudiante pierda la regularidad, permitiendo una intervención pedagógica a tiempo.',
		highlight: 'Detección proactiva antes de quedar libre',
	},
	{
		id: 'comunicados-familias',
		category: 'general',
		question: '¿Cómo se comunica la institución con la comunidad educativa?',
		answer:
			'El módulo de Comunicados permite emitir avisos institucionales segmentados por nivel (inicial, primario, secundario), por curso específico o globales para toda la institución. Los destinatarios reciben los anuncios con acuse de lectura, facilitando el seguimiento de circulares y notificaciones importantes.',
	},
	{
		id: 'reportes-exportacion',
		category: 'asistencia',
		question:
			'¿Se pueden exportar los datos para las planillas oficiales del Ministerio?',
		answer:
			'Sí. El módulo de reportes consolida la asistencia mensual por división, listando presentismo, ausencias justificadas e injustificadas, y porcentajes individuales y grupales. Estos informes están estructurados para coincidir con las planillas oficiales requeridas por las supervisiones escolares.',
	},
	{
		id: 'roles-permisos',
		category: 'seguridad',
		question: '¿Qué roles contempla la plataforma y cómo se protegen los datos?',
		answer:
			'La plataforma aplica un modelo de control de acceso estricto basado en roles (RBAC):\n• Docentes: acceden únicamente a los cursos y materias que tienen asignados.\n• Preceptores: gestionan la asistencia diaria y avisos de las divisiones a su cargo.\n• Directivos/Administradores: disponen de visibilidad total de la institución, métricas consolidadas y configuración académica.\nLos datos están aislados por institución (arquitectura multi-inquilino segura).',
		highlight: 'Privacidad y seguridad por diseño',
	},
	{
		id: 'dispositivos',
		category: 'implementacion',
		question: '¿En qué dispositivos se puede utilizar?',
		answer:
			'Vir-ttend es una aplicación web responsiva (PWA ready). Funciona en computadoras de escritorio, notebooks, tablets y teléfonos celulares sin necesidad de instalar apps en tiendas de aplicaciones. Es ideal para que los preceptores tomen asistencia directamente desde una tablet o smartphone recorriendo los cursos.',
		highlight: 'Compatible con PC, tablets y celulares',
	},
	{
		id: 'migracion-colegio',
		category: 'implementacion',
		question: '¿Cómo es el proceso de puesta en marcha en un colegio nuevo?',
		answer:
			'La implementación es rápida y asistida: se importa el padrón existente de alumnos, docentes y cursos desde archivos Excel o bases previas, se configuran los turnos y el calendario académico, y se brinda una sesión de capacitación breve para el equipo de preceptoría y directivos.',
	},
];

const CATEGORIES = [
	{ id: 'todas', label: 'Todas las preguntas' },
	{ id: 'general', label: 'General y Demo' },
	{ id: 'asistencia', label: 'Asistencia y Operatoria' },
	{ id: 'alertas', label: 'Alertas y Riesgo' },
	{ id: 'seguridad', label: 'Seguridad y Roles' },
	{ id: 'implementacion', label: 'Implementación' },
] as const;

export default function FaqPage() {
	const router = useRouter();
	const [activeCategory, setActiveCategory] = useState<string>('todas');
	const [searchQuery, setSearchQuery] = useState('');
	const [openItemIds, setOpenItemIds] = useState<Set<string>>(
		new Set(['que-es', 'como-funciona-demo', 'alertas-riesgo']),
	);

	const toggleItem = (id: string) => {
		setOpenItemIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	};

	const filteredFaqs = useMemo(() => {
		const query = searchQuery.toLowerCase().trim();
		return FAQ_ITEMS.filter((item) => {
			const matchesCategory =
				activeCategory === 'todas' || item.category === activeCategory;
			const matchesSearch =
				!query ||
				item.question.toLowerCase().includes(query) ||
				item.answer.toLowerCase().includes(query) ||
				Boolean(item.highlight?.toLowerCase().includes(query));
			return matchesCategory && matchesSearch;
		});
	}, [activeCategory, searchQuery]);

	return (
		<div className="flex min-h-screen flex-col bg-background text-foreground">
			{/* Top Header */}
			<header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-6">
					<div className="flex items-center gap-4">
						<Button
							variant="ghost"
							size="sm"
							className="gap-2 text-muted-foreground hover:text-foreground"
							onClick={() => router.push('/')}
						>
							<ArrowLeft className="h-4 w-4" />
							Volver a la landing
						</Button>
						<span className="h-4 w-[1px] bg-border hidden sm:inline-block" />
						<span className="font-bold tracking-tight hidden sm:inline-block">
							Vir-ttend
						</span>
					</div>

					<div className="flex items-center gap-3">
						<Button
							variant="default"
							size="sm"
							className="gap-2"
							onClick={() => router.push('/#demo-roles')}
						>
							<span>Probar Demo</span>
							<ArrowRight className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</header>

			<main className="flex-1 py-12 sm:py-16">
				<div className="mx-auto max-w-4xl px-6">
					{/* Header section */}
					<div className="text-center space-y-4">
						<Badge variant="outline" className="px-3 py-1 gap-1.5 text-xs">
							<HelpCircle className="h-3.5 w-3.5 text-primary" />
							Centro de Respuestas
						</Badge>
						<h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
							Preguntas frecuentes
						</h1>
						<p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg">
							Todo lo que necesitás saber sobre la plataforma Vir-ttend, el
							funcionamiento de la demo y cómo implementarlo en tu institución escolar.
						</p>
					</div>

					{/* Search input */}
					<div className="mt-8 relative max-w-xl mx-auto">
						<Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							type="text"
							placeholder="Buscar por palabra clave (ej. alertas, justificaciones, roles...)"
							className="pl-10 pr-4 h-11 text-sm bg-muted/30 focus-visible:bg-background"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>

					{/* Category filter pills */}
					<div className="mt-6 flex flex-wrap items-center justify-center gap-2">
						{CATEGORIES.map((cat) => {
							const isActive = activeCategory === cat.id;
							return (
								<button
									type="button"
									key={cat.id}
									onClick={() => setActiveCategory(cat.id)}
									className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
										isActive
											? 'bg-primary text-primary-foreground shadow-sm'
											: 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
									}`}
								>
									{cat.label}
								</button>
							);
						})}
					</div>

					{/* FAQ List */}
					<div className="mt-10 space-y-4">
						{filteredFaqs.length === 0 ? (
							<div className="text-center py-12 rounded-xl border border-dashed p-8">
								<p className="text-muted-foreground text-sm">
									No se encontraron preguntas que coincidan con «{searchQuery}».
								</p>
								<Button
									variant="outline"
									size="sm"
									className="mt-4"
									onClick={() => {
										setSearchQuery('');
										setActiveCategory('todas');
									}}
								>
									Restablecer filtros
								</Button>
							</div>
						) : (
							filteredFaqs.map((faq) => {
								const isOpen = openItemIds.has(faq.id);
								return (
									<div
										key={faq.id}
										className="card-hover-lift rounded-xl border bg-card text-card-foreground shadow-sm transition-all overflow-hidden"
									>
										<button
											type="button"
											className="w-full px-6 py-4 flex items-center justify-between text-left gap-4 hover:bg-muted/30 transition-colors"
											onClick={() => toggleItem(faq.id)}
										>
											<div className="flex items-center gap-3">
												<span className="font-semibold text-base sm:text-lg">
													{faq.question}
												</span>
												{faq.highlight && (
													<Badge
														variant="secondary"
														className="hidden sm:inline-flex text-[10px] font-normal"
													>
														{faq.highlight}
													</Badge>
												)}
											</div>
											<ChevronDown
												className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 ${
													isOpen ? 'rotate-180 text-primary' : ''
												}`}
											/>
										</button>
										{isOpen && (
											<div className="animate-fade-in px-6 pb-5 pt-1 text-sm sm:text-base text-muted-foreground border-t bg-muted/5 whitespace-pre-line leading-relaxed">
												{faq.answer}
											</div>
										)}
									</div>
								);
							})
						)}
					</div>

					{/* Still have questions banner */}
					<Card className="mt-14 border-primary/20 bg-gradient-to-r from-primary/5 via-background to-primary/5">
						<CardHeader>
							<div className="flex items-center gap-2 text-primary font-semibold text-sm">
								<Sparkles className="h-4 w-4" />
								<span>¿Tenés dudas particulares para tu colegio?</span>
							</div>
							<CardTitle className="text-xl sm:text-2xl mt-1">
								Experimentá el sistema en vivo con datos reales
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<p className="text-sm text-muted-foreground">
								Ingresá a la demo interactiva como directora, preceptor o docente para
								ver en detalle los flujos de trabajo, pantallas y reportes
								institucionales.
							</p>
							<div className="flex flex-wrap items-center gap-3 pt-2">
								<Button className="gap-2" onClick={() => router.push('/#demo-roles')}>
									<span>Explorar perfiles interactivos</span>
									<ArrowRight className="h-4 w-4" />
								</Button>
								<Button variant="outline" onClick={() => router.push('/')}>
									Volver a la landing
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>
			</main>

			{/* Minimal Footer */}
			<footer className="border-t bg-muted/30 py-6">
				<div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 text-xs text-muted-foreground">
					<span>Vir-ttend · Sistema de Asistencia y Alertas Escolares</span>
					<span>Contraseña demo: {DEMO_DEFAULT_PASSWORD}</span>
				</div>
			</footer>
		</div>
	);
}
