import { DownloadButtons } from '@/components/download-buttons';
import { findSchoolApp, mobileApps } from '@/config/mobile-apps';
import { renderQrSvg } from '@/lib/qr';
import { siteConfig } from '@/lib/site-config';
import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PageProps {
	params: Promise<{ slug: string }>;
}

// Only the slugs in the config exist; anything else is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
	return mobileApps.schools.map((school) => ({ slug: school.slug }));
}

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { slug } = await params;
	const school = findSchoolApp(slug);
	if (!school) return {};
	return {
		title: `App de ${school.shortName}`,
		description: `Descargá la app móvil de ${school.name} para Android y iOS.`,
		alternates: { canonical: `/descargar/${school.slug}` },
	};
}

export default async function SchoolDownloadPage({ params }: PageProps) {
	const { slug } = await params;
	const school = findSchoolApp(slug);
	if (!school) notFound();

	const pageUrl = siteConfig.siteUrl
		? `${siteConfig.siteUrl}/descargar/${school.slug}`
		: null;
	const qrSvg = pageUrl ? await renderQrSvg(pageUrl) : null;

	return (
		<div className="mx-auto w-full max-w-3xl space-y-10 px-6 py-16">
			<Link
				href="/descargar"
				className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
			>
				<ArrowLeft className="h-4 w-4" aria-hidden="true" />
				Todas las apps
			</Link>

			<header className="flex items-center gap-5">
				{school.crest ? (
					<img
						src={school.crest}
						alt={`Escudo de ${school.shortName}`}
						width={72}
						height={72}
						className="h-[72px] w-[72px] shrink-0 object-contain"
					/>
				) : null}
				<div className="space-y-1">
					<h1 className="text-balance text-3xl font-extrabold tracking-tight">
						{school.shortName}
					</h1>
					<p className="text-sm text-muted-foreground">{school.name}</p>
				</div>
			</header>

			<section aria-labelledby="descarga" className="space-y-5">
				<h2 id="descarga" className="text-xl font-bold">
					Descargá la app
				</h2>
				<DownloadButtons downloads={school.downloads} />
				<p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
					Esta app se conecta únicamente al servidor de {school.shortName}. Para
					usarla necesitás una cuenta creada por la escuela. Si pertenecés a otra
					institución, buscá su app en la{' '}
					<Link
						href="/descargar"
						className="font-medium text-foreground underline underline-offset-4"
					>
						lista de descargas
					</Link>
					.
				</p>
			</section>

			<section aria-labelledby="qr" className="space-y-4">
				<h2 id="qr" className="text-xl font-bold">
					Compartí esta página
				</h2>
				{qrSvg ? (
					<div className="flex flex-wrap items-center gap-6">
						<div
							role="img"
							aria-label={`Código QR de la página de descarga de ${school.shortName}`}
							className="h-44 w-44 shrink-0 rounded-lg border bg-white p-2 [&>svg]:h-full [&>svg]:w-full"
							dangerouslySetInnerHTML={{ __html: qrSvg }}
						/>
						<p className="max-w-sm text-sm text-muted-foreground">
							Imprimilo o compartilo con la comunidad de la escuela: lleva a esta
							página, que muestra la descarga correcta para cada teléfono.
							<span className="mt-2 block break-all font-mono text-xs">{pageUrl}</span>
						</p>
					</div>
				) : (
					<p className="text-sm text-muted-foreground">
						El código QR no está disponible porque el sitio no tiene configurada su
						URL pública (<code>NEXT_PUBLIC_SITE_URL</code>).
					</p>
				)}
			</section>
		</div>
	);
}
