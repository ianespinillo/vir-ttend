import { DownloadButtons } from '@/components/download-buttons';
import { mobileApps } from '@/config/mobile-apps';
import { ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
	title: 'Descargar la app',
	description:
		'Descargá la app móvil de Vir-ttend para Android y iOS, o buscá la app propia de tu escuela.',
	alternates: { canonical: '/descargar' },
};

export default function DownloadPage() {
	return (
		<div className="mx-auto w-full max-w-4xl space-y-14 px-6 py-16">
			<header className="space-y-3">
				<h1 className="text-balance text-4xl font-extrabold tracking-tight">
					Descargá la app de Vir-ttend
				</h1>
				<p className="text-lg text-muted-foreground">
					Pase de lista en el aula, con o sin conexión a internet. Las apps todavía
					no están publicadas en las tiendas.
				</p>
			</header>

			<section aria-labelledby="general" className="space-y-5">
				<div className="space-y-1">
					<h2 id="general" className="text-2xl font-bold">
						App general de Vir-ttend
					</h2>
					<p className="text-sm text-muted-foreground">
						Para escuelas que usan la instancia compartida multi-escuela.
					</p>
				</div>
				<DownloadButtons downloads={mobileApps.general} />
			</section>

			<section aria-labelledby="escuelas" className="space-y-5">
				<div className="space-y-1">
					<h2 id="escuelas" className="text-2xl font-bold">
						Escuelas con app propia
					</h2>
					<p className="text-sm text-muted-foreground">
						Las escuelas con servidor dedicado tienen su propia app. Elegí la de tu
						escuela.
					</p>
				</div>
				{mobileApps.schools.length === 0 ? (
					<p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
						Todavía no hay escuelas con app propia.
					</p>
				) : (
					<ul className="grid gap-4 sm:grid-cols-2">
						{mobileApps.schools.map((school) => (
							<li key={school.slug}>
								<Link
									href={`/descargar/${school.slug}`}
									className="flex h-full items-center gap-4 rounded-xl border bg-card p-5 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
								>
									{school.crest ? (
										<img
											src={school.crest}
											alt=""
											width={48}
											height={48}
											className="h-12 w-12 shrink-0 object-contain"
										/>
									) : null}
									<span className="flex-1">
										<span className="block font-semibold">{school.shortName}</span>
										<span className="block text-xs text-muted-foreground">
											{school.name}
										</span>
									</span>
									<ArrowRight
										className="h-4 w-4 shrink-0 text-muted-foreground"
										aria-hidden="true"
									/>
								</Link>
							</li>
						))}
					</ul>
				)}
				<p className="text-sm text-muted-foreground">
					¿Tu escuela tiene servidor propio y no figura acá?{' '}
					<Link
						href="/#contacto"
						className="font-medium text-foreground underline underline-offset-4"
					>
						Contactanos
					</Link>
					.
				</p>
			</section>
		</div>
	);
}
