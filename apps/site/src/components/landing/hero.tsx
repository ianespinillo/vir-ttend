import { buttonStyles } from '@/components/button-styles';
import { siteConfig } from '@/lib/site-config';
import { Check, CloudOff, Shield } from 'lucide-react';

const SAMPLE_STUDENTS = [
	{ name: 'Camila Acosta', status: 'P', label: 'Presente' },
	{ name: 'Tomás Benítez', status: 'A', label: 'Ausente' },
	{ name: 'Lucía Domínguez', status: 'P', label: 'Presente' },
	{ name: 'Mateo Giménez', status: 'T', label: 'Tarde' },
	{ name: 'Valentina Ríos', status: 'J', label: 'Justificado' },
] as const;

const STATUS_STYLES: Record<string, string> = {
	P: 'bg-emerald-100 text-emerald-900',
	A: 'bg-rose-100 text-rose-900',
	T: 'bg-amber-100 text-amber-900',
	J: 'bg-sky-100 text-sky-900',
};

function AttendancePreview() {
	return (
		<figure
			className="rounded-2xl bg-card p-5 text-card-foreground shadow-2xl"
			aria-label="Ejemplo ilustrativo de un pase de lista"
		>
			<div className="flex items-center justify-between gap-3 border-b pb-3">
				<div>
					<p className="text-sm font-semibold">3.º Año A · Pase de lista</p>
					<p className="text-xs text-muted-foreground">Datos de ejemplo</p>
				</div>
				<span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
					<CloudOff className="h-3.5 w-3.5" aria-hidden="true" />
					Sin conexión
				</span>
			</div>
			<ul className="divide-y">
				{SAMPLE_STUDENTS.map((student) => (
					<li
						key={student.name}
						className="flex items-center justify-between py-2.5 text-sm"
					>
						<span>{student.name}</span>
						<span
							className={`rounded-md px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[student.status]}`}
						>
							{student.label}
						</span>
					</li>
				))}
			</ul>
			<p className="mt-3 flex items-center gap-2 rounded-lg bg-brand-lime/40 px-3 py-2 text-xs font-medium text-primary">
				<Check className="h-4 w-4" aria-hidden="true" />
				Guardado en el dispositivo. Se sincroniza al recuperar la conexión.
			</p>
		</figure>
	);
}

export function Hero() {
	return (
		<section className="bg-primary text-primary-foreground">
			<div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 py-16 sm:py-24 lg:grid-cols-2">
				<div className="space-y-6">
					<p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-medium">
						<span className="h-2 w-2 rounded-full bg-brand-lime" />
						Asistencia escolar online y offline
					</p>
					<h1 className="text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">
						La asistencia de tu escuela, simple y siempre disponible
					</h1>
					<p className="max-w-xl text-pretty text-lg text-primary-foreground/85">
						Pase de lista diario y por materia, justificaciones, alertas tempranas y
						reportes. Desde la web o desde la app móvil, incluso sin conexión a
						internet.
					</p>
					<div className="flex flex-wrap gap-3">
						<a href={siteConfig.demoUrl} className={buttonStyles.accentOnDark}>
							Probar la demo
						</a>
						<a href="#planes" className={buttonStyles.outlineOnDark}>
							Ver planes
						</a>
						{siteConfig.appUrl ? (
							<a href={siteConfig.appUrl} className={buttonStyles.ghostOnDark}>
								Ingresar
							</a>
						) : null}
					</div>
					<ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-primary-foreground/85">
						<li className="flex items-center gap-2">
							<Check className="h-4 w-4 text-brand-lime" aria-hidden="true" />
							Sin planillas en papel
						</li>
						<li className="flex items-center gap-2">
							<CloudOff className="h-4 w-4 text-brand-lime" aria-hidden="true" />
							Funciona sin conexión
						</li>
						<li className="flex items-center gap-2">
							<Shield className="h-4 w-4 text-brand-lime" aria-hidden="true" />
							Datos separados por escuela
						</li>
					</ul>
				</div>

				<div className="mx-auto w-full max-w-md lg:mx-0 lg:justify-self-end">
					<AttendancePreview />
				</div>
			</div>
		</section>
	);
}
