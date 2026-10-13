import { SectionHeading } from '@/components/section-heading';

const STEPS = [
	{
		title: 'Configuramos tu escuela',
		description:
			'Cargamos el padrón de estudiantes, docentes y cursos, y definimos turnos, calendario y umbrales de alerta junto con tu equipo.',
	},
	{
		title: 'El equipo toma asistencia',
		description:
			'Preceptores y docentes pasan lista desde la web o desde la app móvil, con o sin conexión a internet.',
	},
	{
		title: 'Alertas y reportes al día',
		description:
			'Los porcentajes se calculan solos y la dirección recibe alertas y reportes sin armar planillas a fin de mes.',
	},
];

export function HowItWorks() {
	return (
		<section id="como-funciona" className="border-b bg-muted/50 py-16 sm:py-24">
			<div className="mx-auto w-full max-w-6xl space-y-12 px-6">
				<SectionHeading
					eyebrow="Cómo funciona"
					title="Empezar es simple"
					description="Una puesta en marcha asistida, en tres pasos."
				/>
				<ol className="grid gap-6 md:grid-cols-3">
					{STEPS.map((step, index) => (
						<li key={step.title} className="rounded-xl border bg-card p-6">
							<span className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-brand-lime text-lg font-bold text-primary">
								{index + 1}
							</span>
							<h3 className="text-lg font-semibold">{step.title}</h3>
							<p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
						</li>
					))}
				</ol>
			</div>
		</section>
	);
}
