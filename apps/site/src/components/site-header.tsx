import { siteConfig } from '@/lib/site-config';
import Link from 'next/link';
import { buttonStyles } from './button-styles';
import { Logo } from './virttend-mark';

const NAV_LINKS = [
	{ href: '/#caracteristicas', label: 'Características' },
	{ href: '/#como-funciona', label: 'Cómo funciona' },
	{ href: '/#planes', label: 'Planes' },
	{ href: '/#app-movil', label: 'App móvil' },
	{ href: '/#faq', label: 'Preguntas' },
	{ href: '/blog', label: 'Novedades' },
	{ href: '/#contacto', label: 'Contacto' },
];

export function SiteHeader() {
	return (
		<header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
			<div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-6">
				<Link href="/" aria-label="Vir-ttend, inicio">
					<Logo />
				</Link>

				<nav aria-label="Principal" className="hidden items-center gap-6 lg:flex">
					{NAV_LINKS.map((link) => (
						<Link
							key={link.href}
							href={link.href}
							className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
						>
							{link.label}
						</Link>
					))}
				</nav>

				<div className="flex items-center gap-2">
					{siteConfig.appUrl ? (
						<a
							href={siteConfig.appUrl}
							className={`${buttonStyles.outline} hidden sm:inline-flex`}
						>
							Ingresar
						</a>
					) : null}
					<a href={siteConfig.demoUrl} className={buttonStyles.primary}>
						Probar la demo
					</a>
				</div>
			</div>
		</header>
	);
}
