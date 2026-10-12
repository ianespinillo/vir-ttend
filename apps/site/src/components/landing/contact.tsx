import { buttonStyles } from '@/components/button-styles';
import { contactMailto, siteConfig } from '@/lib/site-config';

export function Contact() {
	return (
		<section
			id="contacto"
			className="bg-primary py-16 text-primary-foreground sm:py-24"
		>
			<div className="mx-auto w-full max-w-3xl space-y-6 px-6 text-center">
				<h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
					Hablemos de la asistencia de tu escuela
				</h2>
				<p className="text-balance text-lg text-primary-foreground/85">
					Contanos cuántos estudiantes tiene tu escuela y qué necesitás. Te
					respondemos con una propuesta y coordinamos una demostración.
				</p>
				<div className="flex flex-wrap items-center justify-center gap-3 pt-2">
					<a
						href={contactMailto('Consulta sobre Vir-ttend')}
						className={buttonStyles.accentOnDark}
					>
						Escribinos a {siteConfig.contactEmail}
					</a>
					<a href={siteConfig.demoUrl} className={buttonStyles.outlineOnDark}>
						Probar la demo
					</a>
				</div>
			</div>
		</section>
	);
}
