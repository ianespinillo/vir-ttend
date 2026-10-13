import { SectionHeading } from '@/components/section-heading';
import {
	BarChart3,
	CalendarCheck,
	Database,
	FileCheck,
	Megaphone,
	ShieldCheck,
	Smartphone,
	TriangleAlert,
} from 'lucide-react';

const FEATURES = [
	{
		icon: CalendarCheck,
		title: 'Pase de lista diario y por materia',
		description:
			'La preceptoría toma la asistencia del curso y cada docente la de su materia, en segundos y sin duplicar tareas.',
	},
	{
		icon: FileCheck,
		title: 'Justificaciones',
		description:
			'Registro de motivos y observaciones por inasistencia, y reglas de tardanza según el reglamento de la escuela.',
	},
	{
		icon: TriangleAlert,
		title: 'Alertas tempranas',
		description:
			'Avisos automáticos cuando un estudiante se acerca a los umbrales de inasistencia que la escuela define.',
	},
	{
		icon: BarChart3,
		title: 'Reportes mensuales',
		description:
			'Presentismo por división, ausencias justificadas e injustificadas y porcentajes individuales y grupales.',
	},
	{
		icon: Smartphone,
		title: 'App móvil con modo offline',
		description:
			'Tomá asistencia sin conexión. Los registros se guardan en el teléfono y se sincronizan al volver la señal.',
	},
	{
		icon: Megaphone,
		title: 'Comunicados',
		description:
			'Avisos institucionales segmentados por nivel, curso o rol, con registro de lectura.',
	},
	{
		icon: ShieldCheck,
		title: 'Roles y permisos',
		description:
			'Cada persona ve solo lo que le corresponde: docentes, preceptores y directivos con accesos distintos.',
	},
	{
		icon: Database,
		title: 'Datos separados por escuela',
		description:
			'La información de cada institución está aislada de la de las demás, en el plan Compartido y en el Servidor dedicado.',
	},
];

export function Features() {
	return (
		<section id="caracteristicas" className="border-b py-16 sm:py-24">
			<div className="mx-auto w-full max-w-6xl space-y-12 px-6">
				<SectionHeading
					eyebrow="Características"
					title="Todo lo que el equipo necesita para cuidar la asistencia"
					description="Herramientas pensadas para el ritmo real de una escuela."
				/>
				<ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
					{FEATURES.map(({ icon: Icon, title, description }) => (
						<li key={title} className="rounded-xl border bg-card p-6">
							<span className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
								<Icon className="h-5 w-5" aria-hidden="true" />
							</span>
							<h3 className="text-base font-semibold">{title}</h3>
							<p className="mt-2 text-sm text-muted-foreground">{description}</p>
						</li>
					))}
				</ul>
			</div>
		</section>
	);
}
