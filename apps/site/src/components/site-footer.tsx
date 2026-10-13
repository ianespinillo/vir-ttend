import { contactMailto, siteConfig } from '@/lib/site-config';
import Link from 'next/link';
import { Logo } from './virttend-mark';

const FOOTER_LINKS = [
	{ href: '/#caracteristicas', label: 'Características' },
	{ href: '/#planes', label: 'Planes' },
	{ href: '/descargar', label: 'Descargar la app' },
	{ href: '/#faq', label: 'Preguntas frecuentes' },
	{ href: '/#contacto', label: 'Contacto' },
	{ href: '/privacidad', label: 'Política de privacidad' },
];

export function SiteFooter() {
	return (
		<footer className="border-t bg-primary text-primary-foreground">
			<div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-10 md:grid-cols-[1fr_auto]">
				<div className="space-y-3">
					<Logo onDark />
					<p className="max-w-sm text-sm text-primary-foreground/80">
						Asistencia escolar simple, online y offline, para escuelas de nivel
						inicial, primario y secundario.
					</p>
					<p className="text-sm text-primary-foreground/80">
						<a
							href={contactMailto('Consulta sobre Vir-ttend')}
							className="underline underline-offset-4 hover:text-primary-foreground"
						>
							{siteConfig.contactEmail}
						</a>
					</p>
				</div>

				<nav aria-label="Pie de página">
					<ul className="grid gap-2 text-sm sm:grid-cols-2 sm:gap-x-10">
						{FOOTER_LINKS.map((link) => (
							<li key={link.href}>
								<Link
									href={link.href}
									className="text-primary-foreground/80 hover:text-primary-foreground"
								>
									{link.label}
								</Link>
							</li>
						))}
						<li>
							<a
								href={siteConfig.demoUrl}
								className="text-primary-foreground/80 hover:text-primary-foreground"
							>
								Probar la demo
							</a>
						</li>
					</ul>
				</nav>
			</div>
			<div className="border-t border-white/10">
				<p className="mx-auto w-full max-w-6xl px-6 py-4 text-xs text-primary-foreground/70">
					© {new Date().getFullYear()} Vir-ttend. Todos los derechos reservados.
				</p>
			</div>
		</footer>
	);
}
