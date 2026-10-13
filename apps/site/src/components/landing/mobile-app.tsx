import { DownloadButtons } from '@/components/download-buttons';
import { SectionHeading } from '@/components/section-heading';
import { mobileApps } from '@/config/mobile-apps';
import { CloudOff, RefreshCw, Smartphone } from 'lucide-react';
import Link from 'next/link';

const HIGHLIGHTS = [
	{
		icon: CloudOff,
		title: 'Funciona sin conexión',
		description:
			'Tomá asistencia en el aula aunque no haya señal: los registros quedan guardados en el teléfono.',
	},
	{
		icon: RefreshCw,
		title: 'Sincronización automática',
		description:
			'Al recuperar la conexión, los cambios se envían solos al servidor de tu escuela.',
	},
	{
		icon: Smartphone,
		title: 'Android y iOS',
		description:
			'Una app para preceptores y docentes, pensada para usar con una sola mano.',
	},
];

export function MobileApp() {
	return (
		<section id="app-movil" className="border-b bg-muted/50 py-16 sm:py-24">
			<div className="mx-auto w-full max-w-6xl space-y-12 px-6">
				<SectionHeading
					eyebrow="App móvil"
					title="Descargá la app"
					description="La app de Vir-ttend para escuelas del plan Compartido. Las apps todavía no están publicadas en las tiendas."
				/>
				<ul className="grid gap-6 md:grid-cols-3">
					{HIGHLIGHTS.map(({ icon: Icon, title, description }) => (
						<li key={title} className="rounded-xl border bg-card p-6">
							<Icon className="mb-3 h-6 w-6 text-primary" aria-hidden="true" />
							<h3 className="font-semibold">{title}</h3>
							<p className="mt-2 text-sm text-muted-foreground">{description}</p>
						</li>
					))}
				</ul>
				<div className="flex flex-col items-center gap-5 text-center">
					<DownloadButtons downloads={mobileApps.general} />
					<p className="text-sm text-muted-foreground">
						¿Tu escuela tiene servidor propio?{' '}
						<Link
							href="/descargar"
							className="font-medium text-foreground underline underline-offset-4"
						>
							Buscá su app
						</Link>
					</p>
				</div>
			</div>
		</section>
	);
}
