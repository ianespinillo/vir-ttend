import { contactMailto, siteConfig } from '@/lib/site-config';
import { TriangleAlert } from 'lucide-react';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
	title: 'Política de privacidad (borrador)',
	description:
		'Borrador de la política de privacidad de Vir-ttend, conforme a la Ley 25.326 de Protección de los Datos Personales de la República Argentina.',
	// Remove while the text is a draft pending legal review; see the README.
	robots: { index: false, follow: true },
	alternates: { canonical: '/privacidad' },
};

function Section({ title, children }: { title: string; children: ReactNode }) {
	return (
		<section className="space-y-3">
			<h2 className="text-xl font-bold">{title}</h2>
			<div className="space-y-3 text-muted-foreground [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-foreground">
				{children}
			</div>
		</section>
	);
}

export default function PrivacyPage() {
	return (
		<article className="mx-auto w-full max-w-3xl space-y-10 px-6 py-16">
			<aside
				aria-label="Aviso: borrador"
				className="flex gap-3 rounded-xl border-2 border-amber-500 bg-amber-50 p-5 text-amber-950"
			>
				<TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
				<div className="space-y-1 text-sm">
					<p className="font-bold">BORRADOR — pendiente de revisión legal</p>
					<p>
						Este texto es un borrador de trabajo y no constituye todavía la política
						de privacidad vigente. Debe ser revisado y aprobado por un profesional del
						derecho antes de su publicación definitiva. Los datos entre corchetes
						[así] deben completarse.
					</p>
				</div>
			</aside>

			<header className="space-y-2">
				<h1 className="text-balance text-4xl font-extrabold tracking-tight">
					Política de privacidad
				</h1>
				<p className="text-sm text-muted-foreground">
					Última actualización del borrador: octubre de 2026.
				</p>
			</header>

			<Section title="1. Quiénes somos">
				<p>
					Vir-ttend es una plataforma de gestión de asistencia escolar operada por
					[razón social o nombre del titular], CUIT [número], con domicilio en
					[domicilio], República Argentina (en adelante, «Vir-ttend»).
				</p>
				<p>
					Podés contactarnos en{' '}
					<a
						href={contactMailto('Consulta sobre privacidad')}
						className="font-medium text-foreground underline underline-offset-4"
					>
						{siteConfig.contactEmail}
					</a>
					.
				</p>
			</Section>

			<Section title="2. Marco normativo">
				<p>
					El tratamiento de datos personales se rige por la Ley 25.326 de Protección
					de los Datos Personales, su decreto reglamentario 1558/2001 y las
					disposiciones de la Agencia de Acceso a la Información Pública (AAIP),
					autoridad de aplicación de la ley. También se tienen en cuenta las normas
					de protección de niñas, niños y adolescentes aplicables en el ámbito
					educativo.
				</p>
			</Section>

			<Section title="3. Este sitio web">
				<p>
					El sitio de presentación no requiere registro y no incluye herramientas de
					analítica ni cookies de seguimiento. Los datos que podemos recibir son:
				</p>
				<ul>
					<li>
						<strong>Mensajes de contacto:</strong> si nos escribís por correo
						electrónico, recibimos tu dirección y el contenido del mensaje, que usamos
						únicamente para responderte y coordinar una demostración.
					</li>
					<li>
						<strong>Registros técnicos:</strong> el proveedor de alojamiento puede
						registrar datos técnicos de conexión (como la dirección IP y el navegador)
						con fines de seguridad y funcionamiento del servicio.
					</li>
				</ul>
			</Section>

			<Section title="4. La plataforma Vir-ttend y los datos de estudiantes">
				<p>
					Cuando una escuela utiliza Vir-ttend, la escuela es la{' '}
					<strong>responsable de la base de datos</strong> y decide qué información
					carga y con qué finalidad. Vir-ttend actúa como proveedor del servicio y
					trata los datos únicamente por cuenta de la escuela y para prestarle el
					servicio.
				</p>
				<p>Según la configuración de cada escuela, la plataforma puede tratar:</p>
				<ul>
					<li>
						Datos de estudiantes: nombre, documento, curso, división y registros de
						asistencia, tardanzas y justificaciones.
					</li>
					<li>
						Datos de salud contenidos en justificaciones (por ejemplo, certificados
						médicos), que son datos sensibles en los términos del artículo 2 de la Ley
						25.326 y se tratan con las medidas reforzadas que la ley exige.
					</li>
					<li>
						Datos de docentes, preceptores y directivos: nombre, correo electrónico,
						rol y registros de actividad en la plataforma.
					</li>
					<li>Datos de contacto de tutores o familias, si la escuela los carga.</li>
				</ul>
			</Section>

			<Section title="5. Datos de niñas, niños y adolescentes">
				<p>Los estudiantes son, en su mayoría, menores de edad. Por eso:</p>
				<ul>
					<li>
						Los datos de menores se tratan solo para la finalidad educativa e
						institucional de la escuela: registro de asistencia, prevención del
						ausentismo y comunicación con las familias.
					</li>
					<li>
						La escuela es responsable de contar con la base legal para tratar esos
						datos y de informar a las familias y a los responsables legales.
					</li>
					<li>
						Los menores no crean cuentas ni interactúan directamente con la
						plataforma.
					</li>
					<li>
						No utilizamos datos de menores con fines publicitarios ni de elaboración
						de perfiles comerciales, ni los cedemos a terceros.
					</li>
				</ul>
			</Section>

			<Section title="6. Finalidad y cesión">
				<p>
					Los datos se usan exclusivamente para prestar el servicio contratado por la
					escuela. No vendemos ni cedemos datos personales a terceros, salvo
					obligación legal o requerimiento de autoridad competente. Los datos de una
					escuela están separados de los de las demás.
				</p>
			</Section>

			<Section title="7. Proveedores y transferencia internacional">
				<p>
					Para operar el servicio podemos utilizar proveedores de infraestructura y
					alojamiento, incluidos proveedores ubicados fuera de la República
					Argentina. Las transferencias internacionales se realizarán conforme al
					artículo 12 de la Ley 25.326, exigiendo niveles adecuados de protección o
					garantías contractuales equivalentes. [Listar proveedores y países.]
				</p>
			</Section>

			<Section title="8. Seguridad">
				<p>
					Aplicamos medidas técnicas y organizativas para proteger los datos,
					conforme al artículo 9 de la Ley 25.326: control de acceso por roles,
					separación de datos por escuela, conexiones cifradas y copias de respaldo.
					[Detallar medidas definitivas.]
				</p>
			</Section>

			<Section title="9. Conservación">
				<p>
					Conservamos los datos mientras dure la relación con la escuela y por el
					plazo que esta indique o que la ley exija. Al finalizar el servicio se
					devuelven o se eliminan según lo acordado con la escuela. [Definir plazos.]
				</p>
			</Section>

			<Section title="10. Derechos de los titulares">
				<p>
					Los titulares de los datos, o sus representantes legales en el caso de
					menores, pueden ejercer los derechos de acceso, rectificación,
					actualización y supresión (artículos 14 a 16 de la Ley 25.326). Dado que la
					escuela es la responsable de la base de datos, la solicitud debe dirigirse
					en primer lugar a la escuela; también podés escribirnos a{' '}
					<a
						href={contactMailto('Ejercicio de derechos sobre datos personales')}
						className="font-medium text-foreground underline underline-offset-4"
					>
						{siteConfig.contactEmail}
					</a>{' '}
					y la trasladaremos a quien corresponda.
				</p>
				<p>
					El titular de los datos personales tiene la facultad de ejercer el derecho
					de acceso a los mismos en forma gratuita a intervalos no inferiores a seis
					meses, salvo que se acredite un interés legítimo al efecto, conforme lo
					establecido en el artículo 14, inciso 3 de la Ley 25.326.
				</p>
				<p>
					La Agencia de Acceso a la Información Pública, en su carácter de órgano de
					control de la Ley 25.326, tiene la atribución de atender las denuncias y
					reclamos que interpongan quienes resulten afectados en sus derechos por
					incumplimiento de las normas vigentes en materia de protección de datos
					personales.
				</p>
			</Section>

			<Section title="11. Registro de bases de datos">
				<p>
					[Indicar el estado de inscripción de las bases de datos ante el Registro
					Nacional de Bases de Datos de la AAIP, o quién es responsable de
					inscribirlas.]
				</p>
			</Section>

			<Section title="12. Cambios en esta política">
				<p>
					Podemos actualizar esta política. Publicaremos la versión vigente en esta
					página, con su fecha de actualización.
				</p>
			</Section>
		</article>
	);
}
