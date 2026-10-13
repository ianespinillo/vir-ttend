import { buttonStyles } from '@/components/button-styles';
import { SectionHeading } from '@/components/section-heading';
import { contactMailto } from '@/lib/site-config';
import { Check } from 'lucide-react';

interface Plan {
	name: string;
	tagline: string;
	highlights: string[];
	subject: string;
	featured?: boolean;
}

const PLANS: Plan[] = [
	{
		name: 'Compartido',
		tagline:
			'Tu escuela en la instancia multi-escuela de Vir-ttend. La forma más rápida de empezar.',
		highlights: [
			'Instancia multi-escuela con la marca Vir-ttend',
			'Los datos de cada escuela están separados de los demás',
			'Alta rápida y actualizaciones automáticas',
			'App móvil general de Vir-ttend',
		],
		subject: 'Consulta por el plan Compartido',
	},
	{
		name: 'Servidor dedicado',
		tagline:
			'Una instancia propia para tu escuela, con su identidad y su app móvil.',
		highlights: [
			'Instancia propia con base de datos dedicada',
			'Identidad de la escuela (escudo y colores) con «con vir-ttend»',
			'App móvil propia, conectada solo a tu servidor',
			'Dominio propio de la escuela',
			'Con costo adicional',
		],
		subject: 'Consulta por el Servidor dedicado',
		featured: true,
	},
];

export function Plans() {
	return (
		<section id="planes" className="border-b py-16 sm:py-24">
			<div className="mx-auto w-full max-w-6xl space-y-12 px-6">
				<SectionHeading
					eyebrow="Planes"
					title="Elegí cómo usar Vir-ttend en tu escuela"
					description="El mismo producto, con dos modelos de despliegue. Consultanos para una propuesta a medida."
				/>
				<div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
					{PLANS.map((plan) => (
						<article
							key={plan.name}
							className={`flex flex-col rounded-2xl border p-8 ${
								plan.featured ? 'border-primary border-2 bg-card' : 'bg-card'
							}`}
						>
							<h3 className="text-xl font-bold">{plan.name}</h3>
							<p className="mt-2 text-sm text-muted-foreground">{plan.tagline}</p>
							<p className="mt-6 text-2xl font-bold">Consultanos</p>
							<ul className="mt-6 flex-1 space-y-3 text-sm">
								{plan.highlights.map((highlight) => (
									<li key={highlight} className="flex items-start gap-2.5">
										<Check
											className="mt-0.5 h-4 w-4 shrink-0 text-primary"
											aria-hidden="true"
										/>
										<span>{highlight}</span>
									</li>
								))}
							</ul>
							<a
								href={contactMailto(plan.subject)}
								className={`mt-8 ${
									plan.featured ? buttonStyles.primary : buttonStyles.outline
								}`}
							>
								Consultanos
							</a>
						</article>
					))}
				</div>
			</div>
		</section>
	);
}
