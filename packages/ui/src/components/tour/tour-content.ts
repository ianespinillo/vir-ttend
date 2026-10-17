import { APP_ROUTES, ROLES, type Roles } from '@repo/common';

/**
 * Copy of the onboarding tour. Each navigation entry explains what the page
 * is for and lists the two or three actions a newcomer needs first. A role
 * override replaces the shared copy when the page works differently for it.
 */

export interface TourCopy {
	title?: string;
	body: string;
	tips?: string[];
}

interface NavTourCopy extends TourCopy {
	byRole?: Partial<Record<Roles, TourCopy>>;
}

export const TOUR_WELCOME: Record<Roles, TourCopy> = {
	[ROLES.SUPERADMIN]: {
		title: 'Te damos la bienvenida a Vir-ttend',
		body:
			'Como Super Admin gestionás todas las instituciones de la plataforma y sus usuarios. En un minuto te mostramos dónde está cada cosa.',
	},
	[ROLES.ADMIN]: {
		title: 'Te damos la bienvenida a Vir-ttend',
		body:
			'Como administrador configurás tu institución —cursos, alumnos, ciclo lectivo y usuarios— y seguís la asistencia de toda la escuela. Te mostramos cómo.',
	},
	[ROLES.PRECEPTOR]: {
		title: 'Te damos la bienvenida a Vir-ttend',
		body:
			'Como preceptor tomás la asistencia de tus cursos, seguís las alertas de inasistencia y te comunicás con la comunidad. Te mostramos cómo.',
	},
	[ROLES.TEACHER]: {
		title: 'Te damos la bienvenida a Vir-ttend',
		body:
			'Como docente tomás la asistencia de tus materias en cada clase. Es rápido: te mostramos cómo en un par de pasos.',
	},
};

export const TOUR_TENANT_SWITCHER: TourCopy = {
	title: 'Selector de institución',
	body:
		'Desde acá entrás a cualquier institución para operar como ella, y volvés a la vista global cuando terminás.',
};

export const TOUR_FINISH: TourCopy = {
	title: '¡Listo!',
	body:
		'Ya conocés lo esencial. Si querés repasarlo, tocá este botón para volver a ver el tutorial cuando quieras.',
};

export const TOUR_NAV_COPY: Record<string, NavTourCopy> = {
	[APP_ROUTES.tenants]: {
		body: 'Todas las escuelas que usan la plataforma.',
		tips: [
			'«Crear Institución» da de alta una escuela nueva.',
			'Buscá por nombre, subdominio o email y filtrá por estado.',
			'«Ingresar» te lleva adentro de una institución; un banner te recuerda dónde estás y te deja salir.',
		],
	},
	[APP_ROUTES.dashboard]: {
		body: 'Tu punto de partida de cada día.',
		tips: [
			'Las métricas resumen la asistencia del día.',
			'Cada tarjeta de curso muestra presentes, ausentes, tardanzas y lo que falta cargar; tocala para ir directo a tomar asistencia.',
			'El gráfico de tendencia muestra cómo evoluciona la asistencia.',
		],
		byRole: {
			[ROLES.SUPERADMIN]: {
				body: 'Una vista global de la plataforma.',
				tips: [
					'Indicadores de instituciones activas, inactivas y usuarios.',
					'El gráfico muestra las instituciones nuevas de cada mes.',
					'«Actualizar» trae los datos más recientes.',
				],
			},
		},
	},
	[APP_ROUTES.attendanceSubject]: {
		body: 'Tu pantalla principal: la asistencia de cada clase.',
		tips: [
			'Elegí la materia y la fecha; si ese día no hay clase, te avisamos.',
			'Marcá a cada alumno como presente, ausente o tarde, o usá las acciones rápidas.',
			'Nada se guarda hasta que tocás «Confirmar».',
		],
	},
	[APP_ROUTES.courses]: {
		body: 'Los cursos y divisiones de la institución.',
		tips: [
			'Entrá a un curso para ver sus materias, horario, alumnos y asistencia.',
			'En la pestaña Estudiantes de tus cursos podés «Importar alumnos» desde una planilla: descargás la plantilla, la completás, la validás e importás.',
		],
		byRole: {
			[ROLES.ADMIN]: {
				body: 'Los cursos y divisiones del ciclo lectivo.',
				tips: [
					'Filtrá por nivel, turno y año lectivo; «Nuevo Curso» crea una división.',
					'Dentro de cada curso cargás materias, horario y alumnos, o los importás desde una planilla con «Importar alumnos».',
					'En la pestaña Comisiones armás las comisiones de taller a contraturno.',
				],
			},
		},
	},
	[APP_ROUTES.students]: {
		body: 'El padrón de alumnos de la institución.',
		tips: [
			'«Nuevo Estudiante» da de alta un alumno con sus datos y los de su tutor.',
			'Filtrá por curso y por estado: activo, inactivo o transferido.',
			'Abrí el legajo de un alumno para ver su asistencia y el reporte de cada mes.',
		],
		byRole: {
			[ROLES.ADMIN]: {
				body: 'El padrón de alumnos de la institución.',
				tips: [
					'«Nuevo Estudiante» da de alta un alumno con sus datos y los de su tutor.',
					'Filtrá por curso y por estado: activo, inactivo o transferido.',
					'Desde el menú de cada fila matriculás, cambiás de curso, registrás un traslado o desactivás.',
				],
			},
		},
	},
	[APP_ROUTES.attendanceDaily]: {
		body: 'La toma de asistencia diaria de cada curso.',
		tips: [
			'Elegí curso y fecha; «Todos presentes» acelera la carga.',
			'Ante una falta, «Justificar» registra el motivo.',
			'Nada se guarda hasta que tocás «Confirmar».',
		],
	},
	[APP_ROUTES.attendanceWorkshop]: {
		body:
			'La asistencia de taller por comisión, para los cursos con taller a contraturno.',
		tips: [
			'Elegí la fecha: cada comisión indica si ese día hay taller.',
			'Cargá la asistencia de la comisión y confirmá.',
			'Si no ves comisiones, todavía no te asignaron como preceptor de taller.',
		],
		byRole: {
			[ROLES.ADMIN]: {
				body:
					'La asistencia de taller por comisión, para los cursos con taller a contraturno.',
				tips: [
					'Elegí la fecha: cada comisión indica si ese día hay taller.',
					'Cargá la asistencia de la comisión y confirmá.',
					'Las comisiones se arman desde la pestaña Comisiones de cada curso.',
				],
			},
		},
	},
	[APP_ROUTES.alerts]: {
		body:
			'Avisos automáticos cuando un alumno se acerca o supera el límite de inasistencias.',
		tips: [
			'Advertencia, Crítico y Excedido indican la gravedad.',
			'Tocá una alerta para abrir el legajo del alumno.',
			'«Marcar como vista» la saca de las pendientes.',
		],
	},
	[APP_ROUTES.reports]: {
		body: 'El reporte mensual de asistencia de cada curso.',
		tips: [
			'Elegí curso y período; el mes en curso se genera al momento.',
			'Vas a ver el promedio, los alumnos en riesgo y la evolución del mes.',
			'Exportá el detalle por alumno a Excel o PDF.',
		],
	},
	[APP_ROUTES.announcements]: {
		body: 'Las circulares para la comunidad escolar.',
		tips: [
			'«Nuevo comunicado»: título, contenido y audiencia (toda la escuela, un nivel o un curso).',
			'Podés programar la publicación para más adelante.',
			'Filtrá por estado y audiencia para encontrar uno.',
		],
	},
	[APP_ROUTES.meAnnouncements]: {
		body: 'Los comunicados dirigidos a vos.',
		tips: [
			'Los que no leíste tienen un punto.',
			'Al abrir un comunicado se marca como leído.',
		],
	},
	[APP_ROUTES.settingsUsers]: {
		body: 'Las personas de tu institución.',
		tips: [
			'«Crear Usuario» suma preceptores, docentes u otros administradores.',
			'Buscá por nombre o email.',
			'Desde cada usuario restablecés su clave, editás sus datos, cambiás el rol o lo desactivás.',
		],
		byRole: {
			[ROLES.SUPERADMIN]: {
				body: 'El directorio global de usuarios de la plataforma.',
				tips: [
					'«Crear Usuario» da de alta a alguien en una institución, con su rol.',
					'Buscá por nombre o email y filtrá por institución.',
					'Desde cada usuario restablecés su clave, editás sus datos, cambiás el rol o lo desactivás.',
				],
			},
		},
	},
	[APP_ROUTES.settingsTenant]: {
		body:
			'Los datos de tu escuela: nombre, contacto y demás información institucional.',
		tips: ['Mantenelos al día: se usan en reportes y comunicaciones.'],
	},
	[APP_ROUTES.settingsAcademic]: {
		body: 'Los años lectivos y las reglas de asistencia.',
		tips: [
			'«Nuevo Año Lectivo» define las fechas de inicio y fin, y cuál está activo.',
			'El umbral máximo de inasistencias y la tolerancia de tardanza definen cuándo se disparan las alertas.',
		],
	},
	[APP_ROUTES.profile]: {
		body: 'Tus datos personales y tu contraseña.',
		tips: [
			'Actualizá tu nombre y tu email.',
			'Cambiá tu contraseña cuando quieras.',
		],
	},
};

export function getNavTourCopy(href: string, role: Roles): TourCopy | null {
	const copy = TOUR_NAV_COPY[href];
	if (!copy) return null;
	return copy.byRole?.[role] ?? copy;
}

export interface SpecificTourStep {
	id: string;
	title: string;
	body: string;
	tips?: string[];
	target?: string;
	route?: string;
}

export const TUTORIAL_ATTENDANCE_DAILY_STEPS: SpecificTourStep[] = [
	{
		id: 'daily:intro',
		title: 'Asistencia Diaria por Curso',
		body:
			'En este panel preceptores y administradores registran el presentismo diario de cada división.',
		route: APP_ROUTES.attendanceDaily,
	},
	{
		id: 'daily:toolbar',
		title: 'Selección de Curso y Fecha',
		body:
			'Elegí la división y la fecha que vas a cargar o consultar. El selector muestra las divisiones asignadas.',
		tips: [
			'Podés consultar o editar fechas anteriores navegando en el calendario.',
			'Si el día es feriado o no laborable institucional, el sistema te lo indicará.',
		],
		route: APP_ROUTES.attendanceDaily,
		target: '[data-tour="attendance-toolbar"]',
	},
	{
		id: 'daily:quick-actions',
		title: 'Acciones Rápidas de Marcado',
		body:
			'Acelerá el registro masivo marcando a todos los alumnos con un solo clic.',
		tips: [
			'«Todos Presentes» marca el aula completa; luego modificás solo las excepciones.',
			'«Copiar del día anterior» duplica el registro previo si no hubo novedades.',
		],
		route: APP_ROUTES.attendanceDaily,
		target: '[data-tour="attendance-quick-actions"]',
	},
	{
		id: 'daily:grid',
		title: 'Grilla de Alumnos y Justificaciones',
		body: 'Alterná entre Presente (P), Ausente (A) y Tarde (T) en cada fila.',
		tips: [
			'Al marcar Ausente o Tarde, tocá «Justificar» para adjuntar certificado o motivo.',
			'Las justificaciones impactan en el cálculo de las alertas institucionales.',
		],
		route: APP_ROUTES.attendanceDaily,
		target: '[data-tour="attendance-grid"]',
	},
	{
		id: 'daily:confirm',
		title: 'Confirmar y Guardar',
		body: 'Los cambios permanecen en borrador hasta que presionás «Confirmar».',
		tips: [
			'Si necesitás descartar cambios no guardados, presioná «Cancelar».',
			'Al confirmar se recalculan las estadísticas y se disparan las alertas por inasistencia.',
		],
		route: APP_ROUTES.attendanceDaily,
		target: '[data-tour="attendance-confirm-actions"]',
	},
];

export const TUTORIAL_ATTENDANCE_SUBJECT_STEPS: SpecificTourStep[] = [
	{
		id: 'subject:intro',
		title: 'Asistencia de Cátedra',
		body:
			'Como docente, desde acá tomás la lista hora por hora para cada materia que tenés a cargo.',
		route: APP_ROUTES.attendanceSubject,
	},
	{
		id: 'subject:selection',
		title: 'Materia y Día de Cursada',
		body: 'Seleccioná la asignatura y la fecha de la clase a registrar.',
		tips: [
			'Solo vas a ver las materias que tenés asignadas en tu horario escolar.',
			'Si no hay clase ese día (feriado o día no lectivo), el sistema te avisará.',
		],
		route: APP_ROUTES.attendanceSubject,
		target: '[data-tour="attendance-toolbar"]',
	},
	{
		id: 'subject:marking',
		title: 'Marcado de Estados',
		body: 'Marcá a cada estudiante presente, ausente o tarde en tu módulo.',
		tips: [
			'Podés usar las acciones rápidas para agilizar la carga del curso.',
			'Registrá tardanzas en base a la tolerancia de horario de tu institución.',
		],
		route: APP_ROUTES.attendanceSubject,
		target: '[data-tour="attendance-grid"]',
	},
	{
		id: 'subject:confirm',
		title: 'Confirmar Asistencia',
		body:
			'Al terminar la clase, presioná «Confirmar» para asentar la asistencia en el libro de aula virtual.',
		tips: [
			'El presentismo queda registrado de inmediato en el historial de la materia.',
		],
		route: APP_ROUTES.attendanceSubject,
		target: '[data-tour="attendance-confirm-actions"]',
	},
];

export const TUTORIAL_STUDENTS_IMPORT_STEPS: SpecificTourStep[] = [
	{
		id: 'students:intro',
		title: 'Padrón de Estudiantes',
		body:
			'En esta sección gestionás a todos los alumnos matriculados en la institución, organizados por división y turno.',
		route: APP_ROUTES.students,
	},
	{
		id: 'students:create',
		title: 'Alta Individual de Alumno',
		body:
			'El botón «Nuevo Estudiante» abre el formulario para dar de alta a un estudiante particular.',
		tips: [
			'Cargá nombre, apellido, DNI, fecha de nacimiento y contacto del adulto responsable.',
			'Podés asignarlo de inmediato a su curso y división.',
		],
		route: APP_ROUTES.students,
		target: '[data-tour="new-student-button"]',
	},
	{
		id: 'students:import',
		title: 'Importación Masiva por Planilla',
		body:
			'Para cargar divisiones completas desde un archivo Excel o CSV para ahorrar tiempo.',
		tips: [
			'Entrá a «Cursos», abrí la división deseada y andá a la pestaña «Estudiantes».',
			'Tocá «Importar alumnos» y descargá la plantilla oficial con el formato requerido.',
			'El sistema validará el archivo y te advertirá sobre duplicados antes de confirmar.',
		],
		route: APP_ROUTES.courses,
		target: '[data-tour="nav:/courses"]',
	},
	{
		id: 'students:records',
		title: 'Legajo y Acciones Académicas',
		body:
			'Desde el menú de cada alumno podés gestionar su matrícula, registrar traslados o consultar su historial.',
		tips: [
			'Podés cambiar de división a un estudiante en cualquier momento del ciclo lectivo.',
			'Las transferencias conservan el historial de presentismo previo del alumno.',
		],
		route: APP_ROUTES.students,
	},
];

export const TUTORIAL_STUDENT_HISTORY_STEPS: SpecificTourStep[] = [
	{
		id: 'history:intro',
		title: 'Centro de Reportes y Auditoría',
		body:
			'Monitoreá los indicadores de presentismo escolar, alumnos en riesgo y tendencias mensuales.',
		route: APP_ROUTES.reports,
	},
	{
		id: 'history:monthly',
		title: 'Planilla Mensual Consolidada',
		body:
			'Seleccioná el curso y el mes correspondiente para ver la sábana de asistencia.',
		tips: [
			'El porcentaje de asistencia se calcula automáticamente por estudiante y curso.',
			'Identificá rápidamente a los alumnos en alerta por acumulación de inasistencias.',
		],
		route: APP_ROUTES.reports,
	},
	{
		id: 'history:metrics',
		title: 'Métricas e Historial del Alumno',
		body:
			'Cada estudiante cuenta con una vista métrica detallada de su trayectoria de asistencia.',
		tips: [
			'Gráfico comparativo del presentismo del alumno respecto a la media de su división.',
			'Desglose del porcentaje de asistencia materia por materia.',
			'Cronología de inasistencias acumuladas y justificaciones cargadas.',
		],
		route: APP_ROUTES.reports,
	},
	{
		id: 'history:export',
		title: 'Exportación a PDF y Excel',
		body:
			'Generá planillas oficiales listas para imprimir o enviar a supervisión con un solo clic.',
		tips: [
			'Podés exportar tanto el resumen del curso como el detalle individual por alumno.',
		],
		route: APP_ROUTES.reports,
	},
];

export const TUTORIAL_ACADEMIC_CONFIG_STEPS: SpecificTourStep[] = [
	{
		id: 'academic:intro',
		title: 'Configuración del Ciclo Lectivo',
		body:
			'Establecé las fechas del año escolar, los umbrales de inasistencias y las reglas de presentismo.',
		route: APP_ROUTES.settingsAcademic,
	},
	{
		id: 'academic:rules',
		title: 'Umbrales y Tolerancia de Tardanzas',
		body:
			'Configurá los límites de faltas que disparan las alertas automáticas en la institución.',
		tips: [
			'Definí cuándo un alumno pasa a estado de Advertencia, Crítico o Excedido.',
			'Ajustá los minutos de tolerancia para el cómputo de tardanzas.',
		],
		route: APP_ROUTES.settingsAcademic,
	},
	{
		id: 'academic:non-working-days',
		title: 'Declaración de Días No Laborables',
		body: 'Registrá feriados, jornadas pedagógicas o asuetos institucionales.',
		tips: [
			'Tocá «Suspender clases / Feriado» e indicá la fecha y motivo.',
			'Podés optar por publicar automáticamente un comunicado a toda la escuela.',
			'En los días no laborables no se exige toma de lista ni se computan inasistencias.',
		],
		route: APP_ROUTES.settingsAcademic,
		target: '[data-tour="declare-non-working-day"]',
	},
];

export const TUTORIAL_ANNOUNCEMENTS_STEPS: SpecificTourStep[] = [
	{
		id: 'announcements:intro',
		title: 'Cartelera de Comunicados',
		body:
			'Mantené informada a la comunidad escolar mediante avisos, circulares institucionales y novedades.',
		route: APP_ROUTES.announcements,
	},
	{
		id: 'announcements:create',
		title: 'Redactar un Comunicado',
		body:
			'Tocá «Nuevo comunicado» para escribir el título, cuerpo del anuncio y configurar su visibilidad.',
		route: APP_ROUTES.announcements,
		target: '[data-tour="new-announcement-button"]',
	},
	{
		id: 'announcements:audience',
		title: 'Segmentación y Programación',
		body: 'Elegí el alcance de la publicación según los destinatarios previstos.',
		tips: [
			'Alcance institucional, por nivel (Inicial, Primario, Secundario) o por curso específico.',
			'Podés publicar inmediatamente o programar la fecha y hora de emisión.',
			'Los usuarios verán una notificación y el aviso en su bandeja «Para mí».',
		],
		route: APP_ROUTES.announcements,
	},
];
